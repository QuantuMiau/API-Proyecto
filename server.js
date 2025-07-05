import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Client } = pkg;
const app = express();

app.use(json());


// Cors configuration all origens
const corsOption = {
    origen: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-type, usuario_nombre'
};

// middleware use cors
app.use(cors(corsOption));
// middleware analize JSON
app.use(express.json());
//Connect to the database
const client = new Client(
    {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    }
);

client.connect((err) => {
    if (err) {
        console.error('Error al conectar a postres: ', err);
        process.exit(1);
    } else {
        console.log(('Si hay postres OwO'));
        }
});

//Routes
// todos los productos // get all products
app.get('/products', (req, res) => {
    client.query('SELECT * FROM vw_Inventario_general', (err, result) => {
      if (err) {
        res.status(500).json({ message: 'Error al obtener los productos' });
      } else {
        res.json(result.rows);
      }
    });
});

// Insertar un producto // Insert a product
app.post('/products', (req, res) => {
    console.log('usuario_nombre header:', req.headers['usuario_nombre']);

    const { id_concepto, nombre, tipo, categoria, costo, precio, inventario } = req.body;
    const user_name = req.headers['usuario_nombre'];  // Obtenemos el nombre del usuario desde los encabezados

    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1)`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla creada');
        

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho de tabla temporal');
            
            console.log(id_concepto, nombre, tipo, categoria, costo, precio, inventario);
            
            // Si no hubo error, realizamos el insert en la tabla principal
            client.query('CALL InsProducto($1,$2,$3,$4,$5,$6,$7)', 
                [id_concepto, nombre, tipo, categoria, costo, precio, inventario],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            details: err.message
                        });
                    } else {
                        return res.json({ message: 'Producto agregado correctamente' });
                    }
                }
            );
        });
    });
});

// Actualizar un producto // Update a product
app.put('/products/:id', (req, res) => {
    console.log('usuario_nombre header:', req.headers['usuario_nombre']);

    const id = req.params.id; // ID del producto desde los parámetros de la URL
    const { nombre, tipo, categoria, costo, precio } = req.body; // Datos del cuerpo de la solicitud
    const user_name = req.headers['usuario_nombre']; // Obtenemos el nombre del usuario desde los encabezados

    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`;
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1);`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla temporal "temp_usuario" creada');

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho en la tabla temporal "temp_usuario"');
            
            // Actualizar el producto utilizando el procedimiento almacenado
            client.query('CALL UpdProducto($1,$2,$3,$4,$5,$6)', 
                [id, nombre, tipo, categoria, costo, precio], 
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            error: 'Error al actualizar el producto',
                            details: err.message
                        });
                    } else {
                        console.log(`Producto con ID ${id} actualizado correctamente`);
                        return res.json({ message: 'Producto actualizado correctamente' });
                    }
                }
            );
        });
    });
});

// buscar por id // get product by id
app.get('/products/id/:productId', (req, res) => {
    const { productId } = req.params; 
    console.log('ID recibido en el backend:', productId);

    const query = 'SELECT * FROM vw_Inventario_general WHERE id_concepto = $1';

    client.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error al obtener el producto:', err.message); 
            return res.status(500).json({
                error: 'Error al obtener el producto',
                details: err.message
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' }); 
        }

        res.json(result.rows[0]); 
    });
});

// buscar por nombre // get product by name
app.get('/products/name/:productName', (req, res) => {
    const { productName } = req.params; 
    console.log('Nombre recibido en el backend:', productName);

    const query = 'SELECT * FROM vw_Inventario_general WHERE nombre ILIKE $1'; // Usar ILIKE para búsqueda sin distinción entre mayúsculas y minúsculas

    client.query(query, [`%${productName}%`], (err, result) => {
        if (err) {
            console.error('Error al obtener el producto:', err.message); 
            return res.status(500).json({
                error: 'Error al obtener el producto',
                details: err.message
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' }); 
        }

        res.json(result.rows); 
    });
}
);

// eliminar producto // delete product
app.put('/products/delete/:id', (req, res) => {
    const id = req.params.id; // ID del producto desde los parámetros de la URL
    const user_name = req.headers['usuario_nombre']; // Obtenemos el nombre del usuario desde los encabezados

    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`;
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1);`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla temporal "temp_usuario" creada');

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho en la tabla temporal "temp_usuario"');
            
            // Eliminar el producto utilizando el procedimiento almacenado
            client.query('CALL DelConcepto($1)', [id], (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: 'Error al eliminar el producto',
                        details: err.message
                    });
                } else {
                    console.log(`Producto con ID ${id} eliminado correctamente`);
                    return res.json({ message: 'Producto eliminado correctamente' });
                }
            });
        });
    });
});



// traer todos los servicios activos // get all active services
app.get('/services', (req, res) => {
    client.query('SELECT * FROM Vw_Servicios', (err, result) => {
      if (err) {
        res.status(500).json({ message: 'Error al obtener los servicios' });
      } else {
        res.json(result.rows);
      }
    });
});

// Insertar un servicio // Insert a service
app.post('/services', (req, res) => {
    console.log('usuario_nombre header:', req.headers['usuario_nombre']);

    const { id_concepto, nombre,tipo, categoria, costo, precio, duracion} = req.body;
    const user_name = req.headers['usuario_nombre'];  // Obtenemos el nombre del usuario desde los encabezados 
    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1)`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla creada');
        

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho de tabla temporal');
            
            console.log(nombre, costo, precio);
            
            // Si no hubo error, realizamos el insert en la tabla principal
            client.query('CALL InsServicio($1,$2,$3,$4,$5,$6)',
                [nombre, tipo, categoria, costo, precio, duracion],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            details: err.message
                        });
                    } else {
                        return res.json({ message: 'Servicio agregado correctamente' });
                    }
                }
            );
        });
    });
});

// Actualizar un servicio // Update a service
app.put('/services/:id', (req, res) => {
    console.log('usuario_nombre header:', req.headers['usuario_nombre']);

    const id_concepto = req.params.id; // ID del servicio desde los parámetros de la URL
    const { nombre, tipo, categoria, costo, precio, duracion } = req.body; // Datos del cuerpo de la solicitud
    const user_name = req.headers['usuario_nombre']; // Obtenemos el nombre del usuario desde los encabezados

    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`;
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1);`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla creada');

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho de tabla temporal');
            
            // Actualizar el producto utilizando el procedimiento almacenado
            client.query('CALL UpdServicio($1,$2,$3,$4,$5,$6,$7)',
                [id_concepto, nombre, tipo, categoria, costo, precio, duracion],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            error: 'Error al actualizar el servicio',
                            details: err.message
                        });
                    } else {
                        console.log(`Servicio con ID ${id_concepto} actualizado correctamente`);
                        return res.json({ message: 'Servicio actualizado correctamente' });
                    }
                }
            );
        });
    });
});

// buscar por id // get service by id
app.get('/services/id/:serviceId', (req, res) => {
    const { serviceId } = req.params; 
    console.log('ID recibido en el backend:', serviceId);

    const query = 'SELECT * FROM Vw_Servicios WHERE id_concepto = $1';

    client.query(query, [serviceId], (err, result) => {
        if (err) {
            console.error('Error al obtener el servicio:', err.message); 
            return res.status(500).json({
                error: 'Error al obtener el servicio',
                details: err.message
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado' }); 
        }

        res.json(result.rows[0]); 
    });
} );

// eliminar servicio de forma logica // delete service logic form
app.put('/services/delete/:id', (req, res) => {
    const id_concepto = req.params.id; // ID del servicio desde los parámetros de la URL
    const user_name = req.headers['usuario_nombre']; // Obtenemos el nombre del usuario desde los encabezados

    // QUERY crear tabla temporal temp_usuario
    const createTempTableQuery = `CREATE TEMP TABLE IF NOT EXISTS temp_usuario (usuario_nombre TEXT);`;
    // Query para insertar el nombre del usuario en la tabla temporal
    const setUserQuery = `INSERT INTO temp_usuario (usuario_nombre) VALUES ($1);`;

    // Crear la tabla temporal primero
    client.query(createTempTableQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: 'Error al crear la tabla temporal',
                details: err.message
            });
        }

        console.log('tabla creada');

        // Insertar el nombre de usuario en la tabla temporal
        client.query(setUserQuery, [user_name], (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Error al insertar el usuario en la tabla temporal',
                    details: err.message
                });
            }

            console.log('insert hecho de tabla temporal');
            
            // Eliminar el producto utilizando el procedimiento almacenado
            client.query('CALL DelConcepto($1)', [id_concepto], (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: 'Error al eliminar el servicio',
                        details: err.message
                    });
                } else {
                    console.log(`Servicio con ID ${id_concepto} eliminado correctamente`);
                    return res.json({ message: 'Servicio eliminado correctamente' });
                }
            });
        });
    });
}
);


// busqueda por nombre servicio // get service by name
app.get('/services/name/:serviceName', (req, res) => {
    const { serviceName } = req.params; 
    console.log('Nombre recibido en el backend:', serviceName);

    const query = 'SELECT * FROM Vw_Servicios WHERE nombre ILIKE $1'; // Usar ILIKE para búsqueda sin distinción entre mayúsculas y minúsculas

    client.query(query, [`%${serviceName}%`], (err, result) => {
        if (err) {
            console.error('Error al obtener el servicio:', err.message); 
            return res.status(500).json({
                error: 'Error al obtener el servicio',
                details: err.message
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado' }); 
        }

        res.json(result.rows); 
    });
});


app.post('/register', (req, res) => {
    const { nombre, password, email } = req.body;
    const query = 'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING *';
    client.query(query, [nombre, email, password], (err, result) => {
        if (err) {
            console.error('Error al registrar el usuario:', err);
            return res.status(500).json({ error: 'Error al registrar el usuario' });
        }
        const newUser = result.rows[0];
        return res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND password = $2';
    
    client.query(query, [email, password], (err, result) => {
        if (err) {
            console.error('Error al realizar la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return res.json({ message: 'Inicio de sesión exitoso', user });
        } else {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
});

app.get('/users', (req, res) => {
    client.query('SELECT * FROM usuarios', (err, result) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
        res.json(result.rows);
    });
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    client.query('SELECT * FROM usuarios WHERE id = $1', [userId], (err, result) => {
        if (err) {
            console.error('Error al obtener el usuario:', err);
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    });
});    

// inicar servidor // start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server activo en el puerto ${port}`);
});