CREATE OR REPLACE PROCEDURE InsConcepto (
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _extra INT
) LANGUAGE plpgsql AS $$
DECLARE
    _id_generado VARCHAR(15);
    _contador INT;
BEGIN
    CASE _tipo
        WHEN 'Servicio' THEN
            SELECT COUNT(*) + 1 INTO _contador FROM Servicios;
            _id_generado := CONCAT('SERV-', LPAD(_contador::TEXT, 4, '0'));

            INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
            VALUES (_id_generado, _nombre, _tipo, _categoria, _costo, _precio);

            IF _extra >= 60 THEN
                INSERT INTO Servicios(id_concepto, duracion)
                VALUES (_id_generado, make_interval(hours => _extra / 60, mins => _extra % 60));
            ELSE
                INSERT INTO Servicios(id_concepto, duracion)
                VALUES (_id_generado, make_interval(mins => _extra));
            END IF;

            RAISE NOTICE 'Servicio agregado correctamente';
        WHEN 'Producto' THEN
            INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
            VALUES (_id_concepto, _nombre, _tipo, _categoria, _costo, _precio);

            INSERT INTO Productos(id_concepto, inventario)
            VALUES (_id_concepto, _extra);

            RAISE NOTICE 'Producto agregado correctamente';
        WHEN 'Insumo' THEN
            INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria ,costo, precio)
            VALUES (_id_concepto, _nombre, _tipo, _categoria, _costo, _precio);

            INSERT INTO Insumos (id_concepto, inventario)
            VALUES (_id_concepto, _extra);

            RAISE NOTICE 'Insumo agregado correctamente';
        ELSE 
            RAISE EXCEPTION 'Tipo de concepto no valido';
    END CASE;
END;
$$;

CALL InsConcepto(NULL, 'Consulta general', 'Servicio', 'Consulta', 100.00, 150.00, 160);

SELECT C.* , S.duracion
FROM Conceptos C
JOIN Servicios S ON C.id_concepto = S.id_concepto;

-- Actualizar concepto // update concept
-- agregar atributo a la tabla conceptos 'desconituado' boolean // add attribute to the table concepts 'discontinued' boolean
-- IDK lo dejo con el de activo xd ya veo que me invento despues // IDK I leave it with the active one xd I see that i invent later
CREATE OR REPLACE PROCEDURE UpdConcept(
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _tipo VARCHAR(20),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _extra INT;
) LANGUAGE plpgsql AS $$
DECLARE
    _total INT;
BEGIN
    SELECT COUNT(*) INTO _total FROM Conceptos
    WHERE id_concepto = _id_concepto
    AND activo = true;

    IF _total != 0 THEN
        CASE _tipo
            WHEN 'Servicio' THEN 
                UPDATE Conceptos SET nombre = _nombre, tipo = _tipo, categoria = _categoria, costo = _costo, precio = _precio
                WHERE id_concepto = _id_concepto;

                UPDATE Servicios SET duracion = make_interval(hours => _extra / 60, mins => _extra % 60)
                WHERE id_concepto = _id_concepto;
                RAISE NOTICE 'Servicio actualizado correctamente';
            WHEN 'Producto' THEN
                UPDATE Conceptos SET nombre = _nombre, tipo = _tipo, categoria = _categoria, costo = _costo, precio = _precio
                WHERE id_concepto = _id_concepto;
                RAISE NOTICE 'Producto actualizado correctamente';
    ELSE
        RAISE EXCEPTION 'No se encontro el concepto o esta inactivo';
    END IF;
END;
$$;


CALL UpdConcept('SERV-0004', 'Vacuna rabia gato', 'Servicio', 'Vacuna', 100.00, 150.00);

SELECT C.* , S.duracion
FROM Conceptos C
JOIN Servicios S ON C.id_concepto = S.id_concepto;

-- Eliminar concepto de forma logica // delete concept with logical delete
CREATE OR REPLACE PROCEDURE DelConcepto(
    _id_concepto VARCHAR(15)
) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE Conceptos SET activo = False
    WHERE id_concepto = _id_concepto;
END;
$$;

CALL DelConcepto('SERV-0004');

SELECT C.* , S.duracion
FROM Conceptos C
JOIN Servicios S ON C.id_concepto = S.id_concepto
WHERE C.activo = false;

-- Activar concepto // activate concept
CREATE OR REPLACE PROCEDURE ActConcepto(
    _id_concepto VARCHAR(15)
) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE Conceptos SET activo = True
    WHERE id_concepto = _id_concepto;
END;
$$;

CALL ActConcepto('SERV-0004');

-- Actualizar inventario de un producto o insumo // update product or supply inventory
CREATE OR REPLACE PROCEDURE UpdInventario(
    _id_concepto VARCHAR(15),
    _inventario INT,
    _tipo VARCHAR(20)
) LANGUAGE plpgsql AS $$
BEGIN
    Case _tipo
        WHEN 'Producto' THEN
            UPDATE Productos SET inventario = inventario + _inventario
            WHERE id_concepto = _id_concepto;
            RAISE NOTICE 'Inventario actualizado correctamente';
        WHEN 'Insumo' THEN
            UPDATE Insumos SET inventario = inventario + _inventario
            WHERE id_concepto = _id_concepto;
            RAISE NOTICE 'Inventario actualizado correctamente';
        ELSE 
            RAISE EXCEPTION 'Tipo de concepto no valido';
    END CASE;
END;


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
CREATE OR REPLACE InsServicio (
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _extra INT
) LAGUAGE plpgsql AS $$
DECLARE
    _id_generado VARCHAR(15);
    _contador INT;
BEGIN
    SELECT COUNT(*) + 1 INTO _contador FROM Servicios;
    _id_generado := CONCAT('SERV-', LPAD(_contador::TEXT,4, '0'));

    INSERT INTO Conceptos (id_concepto, nombre, tipo, categoria, costo, precio)
    VALUES (_id_generado, _nombre, _tipo, _categoria, _costo, _precio);

    INSERT INTO Servicios (id_concepto, duracion)
    VALUES (_id_generado, make_interval(hours => _extra / 60, min => _extra % 60));

    RAISE NOTICE 'Servicio agregado correctamente';
END;
$$;

CREATE OR REPLACE UptProducto (
    _id_concepto VARCHAR(15),
    _nombre VARCHAR(40),
    _categoria VARCHAR(20),
    _costo NUMERIC(8,2),
    _precio NUMERIC(8,2),
    _inventario INT
) LAGUAGE plpgsql AS $$
BEGIN
    UPDATE Conceptos SET nombre = _nombre, categoria = _categoria, costo = _costo, precio = _precio
    WHERE id_concepto = _id_concepto;

    RAISE NOTICE 'Producto actualizado correctamente';
END;