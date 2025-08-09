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



app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM Clientes WHERE email = $1 AND pass = $2';
    
    client.query(query, [email, password], (err, result) => {
        if (err) {
            console.error('Error al realizar la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (result.rows.length > 0) {
            const { password, ...userWithoutPassword } = result.rows[0];
            return res.json( userWithoutPassword );
        } else {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
});

app.post('/register', (req, res) => {
  const { nombre, apellido_pate, apellido_mate, telefono, email, pass } = req.body;


  const apellidoMateFinal = apellido_mate || '';
  const sql = `CALL sp_registrar_cliente($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [nombre, apellido_pate, apellidoMateFinal, telefono, email, pass], (err, result) => {
    if (err) {
      console.error('Error al registrar cliente:', err);
      return res.status(500).json({ mensaje: err.message});
    }

    res.status(201).json({ mensaje: 'Cliente registrado correctamente' });
  });
});

app.put('/clientes/:id', (req, res) => {
  const id_cliente = parseInt(req.params.id);
  const { nombre, apellido_pate, apellido_mate, telefono, email, pass } = req.body;

  const sql = `CALL sp_actualizar_cliente($1, $2, $3, $4, $5, $6, $7)`;

  client.query(sql, [id_cliente, nombre, apellido_pate, apellido_mate, telefono, email, pass], (err, result) => {
    if (err) {
      console.error('Error al actualizar cliente:', err);
      return res.status(500).json({ mensaje: 'Error interno al actualizar cliente' });
    }

    res.json({ mensaje: 'Cliente actualizado correctamente' });
  });
});

app.post('/pacientes', (req, res) => {
  const {
    id_cliente,
    especie,
    nombre_paciente,
    raza,
    sexo,
    fecha_nacimiento
  } = req.body;

  const sql = `CALL sp_registrar_paciente($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [id_cliente, especie, nombre_paciente, raza, sexo, fecha_nacimiento], (err, result) => {
    if (err) {
      console.error('Error al registrar paciente:', err);
      return res.status(500).json({ mensaje: 'Error interno al registrar paciente' });
    }

    res.status(201).json({ mensaje: 'Paciente registrado correctamente' });
  });
});


// Macotas // 
app.post('/pacientes', (req, res) => {
  const {
    id_cliente,
    especie,
    nombre_paciente,
    raza,
    sexo,
    fecha_nacimiento
  } = req.body;

  const sql = `CALL sp_registrar_paciente($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [id_cliente, especie, nombre_paciente, raza, sexo, fecha_nacimiento], (err, result) => {
    if (err) {
      console.error('Error al registrar paciente:', err);
      return res.status(500).json({ mensaje: 'Error interno al registrar paciente' });
    }

    res.status(201).json({ mensaje: 'Paciente registrado correctamente' });
  });
});


app.put('/pacientes/:id', (req, res) => {
  const id_paciente = parseInt(req.params.id);
  const {
    id_cliente,
    especie,
    nombre_paciente,
    raza,
    sexo,
    fecha_nacimiento,
    estatus
  } = req.body;

  const sql = `CALL sp_actualizar_paciente($1, $2, $3, $4, $5, $6, $7, $8)`;

  client.query(sql, [id_paciente, id_cliente, especie, nombre_paciente, raza, sexo, fecha_nacimiento, estatus], (err, result) => {
    if (err) {
      console.error('Error al actualizar paciente:', err);
      return res.status(500).json({ mensaje: 'Error interno al actualizar paciente' });
    }

    res.json({ mensaje: 'Paciente actualizado correctamente' });
  });
});

app.delete('/pacientes/:id', (req, res) => {
  const id_paciente = parseInt(req.params.id);

  const sql = 'UPDATE Pacientes SET estatus = FALSE WHERE id_paciente = $1';

  client.query(sql, [id_paciente], (err, result) => {
    if (err) {
      console.error('Error al hacer borrado lógico:', err);
      return res.status(500).json({ mensaje: 'Error interno al eliminar paciente' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }

    res.json({ mensaje: 'Paciente eliminado lógicamente correctamente' });
  });
});

app.get('/clientes/:id_cliente/mascotas', (req, res) => {
  const { id_cliente } = req.params;

  const sql = `SELECT * FROM Pacientes WHERE id_cliente = $1 AND estatus = TRUE`;

  client.query(sql, [id_cliente], (err, result) => {
    if (err) {
      console.error('Error al obtener mascotas del cliente:', err);
      return res.status(500).json({ mensaje: 'Error interno al obtener mascotas' });
    }

    res.status(200).json(result.rows);
  });
});

// obtener mascota con por id con visitas
app.get('/pacientes/:id', (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM vw_paciente_con_visitas WHERE id_paciente = $1`;

  client.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al obtener paciente:', err);
      return res.status(500).json({ mensaje: 'Error interno al obtener paciente' });
    }

    res.status(200).json(result.rows);
  });
});

app.get('/paciente/:id', (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM vw_paciente_detalle  WHERE id_paciente = $1`;

  client.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al obtener paciente:', err);
      return res.status(500).json({ mensaje: 'Error interno al obtener paciente' });
    }

    res.status(200).json(result.rows);
  });
});





// visitas
app.post('/visitas', (req, res) => {
  const { id_paciente, id_motivo, fecha, peso, edad, notas } = req.body;

  const sql = `CALL sp_registrar_visita($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [id_paciente, id_motivo, fecha, peso, edad, notas], (err) => {
    if (err) {
      console.error('Error al registrar visita:', err);
      return res.status(500).json({ mensaje: 'Error interno al registrar visita' });
    }
    res.status(201).json({ mensaje: 'Visita registrada correctamente' });
  });
});

app.put('/visitas/:id', (req, res) => {
  const id_visita = parseInt(req.params.id);
  const { id_paciente, id_motivo, fecha, peso, edad, notas } = req.body;

  const sql = `CALL sp_actualizar_visita($1, $2, $3, $4, $5, $6, $7)`;

  client.query(sql, [id_visita, id_paciente, id_motivo, fecha, peso, edad, notas], (err) => {
    if (err) {
      console.error('Error al actualizar visita:', err);
      return res.status(500).json({ mensaje: 'Error interno al actualizar visita' });
    }
    res.json({ mensaje: 'Visita actualizada correctamente' });
  });
});

//adjuntos
app.post('/adjuntos', (req, res) => {
  const { id_visita, nombre, url, tipo_adjunto, descripcion } = req.body;

  const sql = `CALL sp_registrar_adjunto($1, $2, $3, $4, $5)`;

  client.query(sql, [id_visita, nombre, url, tipo_adjunto, descripcion], (err) => {
    if (err) {
      console.error('Error al registrar adjunto:', err);
      return res.status(500).json({ mensaje: 'Error interno al registrar adjunto' });
    }
    res.status(201).json({ mensaje: 'Adjunto registrado correctamente' });
  });
});

app.put('/adjuntos/:id', (req, res) => {
  const id_adjunto = parseInt(req.params.id);
  const { id_visita, nombre, url, tipo_adjunto, descripcion } = req.body;

  const sql = `CALL sp_actualizar_adjunto($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [id_adjunto, id_visita, nombre, url, tipo_adjunto, descripcion], (err) => {
    if (err) {
      console.error('Error al actualizar adjunto:', err);
      return res.status(500).json({ mensaje: 'Error interno al actualizar adjunto' });
    }
    res.json({ mensaje: 'Adjunto actualizado correctamente' });
  });
});

//citas
app.post('/citas', (req, res) => {
  const { id_cliente, especie, fecha, hora, motivo } = req.body;

  const sql = `CALL sp_registrar_cita($1, $2, $3, $4, $5)`;

  client.query(sql, [id_cliente, especie, fecha, hora, motivo], (err) => {
    if (err) {
      console.error('Error al registrar cita:', err);
      return res.status(500).json({ mensaje: 'Error interno al registrar cita' });
    }
    res.status(201).json({ mensaje: 'Cita registrada correctamente' });
  });
});

app.put('/citas/:id', (req, res) => {
  const id_cita = parseInt(req.params.id);
  const { id_cliente, especie, fecha, hora, motivo } = req.body;

  const sql = `CALL sp_actualizar_cita($1, $2, $3, $4, $5, $6)`;

  client.query(sql, [id_cita, id_cliente, especie, fecha, hora, motivo], (err) => {
    if (err) {
      console.error('Error al actualizar cita:', err);
      return res.status(500).json({ mensaje: 'Error interno al actualizar cita' });
    }
    res.json({ mensaje: 'Cita actualizada correctamente' });
  });
});

app.delete('/citas/:id', (req, res) => {
  const id_cita = parseInt(req.params.id);

  const sql = 'DELETE FROM Citas WHERE id_cita = $1';

  client.query(sql, [id_cita], (err, result) => {
    if (err) {
      console.error('Error al eliminar cita:', err);
      return res.status(500).json({ mensaje: 'Error interno al eliminar cita' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }

    res.json({ mensaje: 'Cita eliminada correctamente' });
  });
});


// inicar servidor // start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server activo en el puerto ${port}`);
});