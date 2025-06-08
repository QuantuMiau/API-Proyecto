-- Agregar nuevo producto // add new product
CREATE OR REPLACE PROCEDURE InsProducto(
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _inventario INT
)
LANGUAGE plpgsql AS $$
DECLARE
    _total INT;
BEGIN
    SELECT COUNT(*) INTO _total FROM Conceptos
    WHERE id_concepto = _id_concepto;

    IF _total = 0 THEN
        INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
        VALUES (_id_concepto, _nombre, _tipo, _categoria, _costo, _precio);

        INSERT INTO Productos(id_concepto, inventario)
        VALUES (_id_concepto, _inventario);

        RAISE NOTICE 'Producto agregado correctamente';
    ELSE
        RAISE EXCEPTION 'El producto ya esta registrado';
    END IF;
END;
$$;

CALL InsProducto('PROD-0006', 'Correa', 'Producto', 'Accesorio', 50.00, 100.00, 100);
SELECT C.*, P.inventario
FROM CONCEPTOS C
JOIN PRODUCTOS P ON C.id_concepto = P.id_concepto;

-- Agregar insumo // add new supply
CREATE OR REPLACE PROCEDURE InsInsumo(
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _inventario INT
)
LANGUAGE plpgsql AS $$
DECLARE
    _total INT;
BEGIN
    SELECT COUNT(*) INTO _total FROM Conceptos
    WHERE id_concepto = _id_concepto;

    IF _total = 0 THEN
        INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
        VALUES (_id_concepto, _nombre, _tipo, _categoria, _costo, _precio);

        INSERT INTO Insumos(id_concepto, inventario)
        VALUES (_id_concepto, _inventario);

        RAISE NOTICE 'Insumo agregado correctamente';
    ELSE
        RAISE EXCEPTION 'El insumo ya esta registrado';
    END IF;
END;
$$;

CALL InsInsumo('INSU-0005', 'Jeringa', 'Insumo', 'Material', 5.00, 10.00, 100);

SELECT C.*, I.inventario
FROM CONCEPTOS C
JOIN INSUMOS I ON C.id_concepto = I.id_concepto;

-- Agregar nuevo servicio // add new service
CREATE OR REPLACE PROCEDURE InsServicio (
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _duracion INT
) LANGUAGE plpgsql AS $$
DECLARE
    _id_generado VARCHAR(15);
    _contador INT;
BEGIN
    SELECT COUNT(*) + 1 INTO _contador FROM Servicios;
    _id_generado := CONCAT('SERV-', LPAD(_contador::TEXT,4, '0'));

    INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
    VALUES (_id_generado, _nombre, _tipo, _categoria, _costo, _precio);

    INSERT INTO Servicios (id_concepto, duracion)
    VALUES (_id_generado, make_interval(hours => _duracion / 60, min => _duracion % 60));

    RAISE NOTICE 'Servicio agregado correctamente';
END;
$$;

CALL InsServicio('Castrasion gato menor a 6kg', 'Servicio', 'Cirugia', 400, 650, 45)

--Actualizar un producto // Update product
CREATE OR REPLACE PROCEDURE UptProducto (
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2)
) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE Conceptos SET nombre = _nombre, tipo = _tipo, categoria = _categoria, costo = _costo, precio = _precio
    WHERE id_concepto = _id_concepto;

    RAISE NOTICE 'Producto actualizado correctamente';
END;
$$;

SELECT * FROM CONCEPTOS;
CALL UptProducto('PROD-0006', 'Raton palito', 'Juguete', 'Producto', 20, 50)

CREATE OR REPLACE PROCEDURE UpdServicio(
    _id_concepto VARCHAR (15),
    _nombre VARCHAR (40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _duracion INT
) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE Conceptos SET nombre = _nombre, tipo = _tipo, categoria = _categoria, costo = _costo, precio = _precio
    WHERE id_concepto = _id_concepto;

    UPDATE Servicios SET duracion = make_interval(hours => _duracion / 60, min => _duracion % 60)
    WHERE id_concepto = _id_concepto;

    RAISE NOTICE 'Servicio actualizado correctamente';
END;
$$;

SELECT * FROM CONCEPTOS
WHERE tipo = 'Servicio';
CALL UpdServicio ('SERV-0005', 'Estetica perro', 'Servicio', 'Estetica', 50, 150);
