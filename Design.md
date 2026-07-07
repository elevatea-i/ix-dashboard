# Guía de Diseño y Arquitectura — IX Capital Group
Este documento detalla la arquitectura de interfaz, los principios estéticos y las especificaciones operativas del sistema de gestión modular **IX Capital Group**.

---

## 1. Identidad Visual y Paleta de Colores (Theme Colors)
La interfaz del sistema utiliza un enfoque editorial, elegante y de alto contraste inspirado en la estética financiera moderna. Toda la paleta se encuentra centralizada en la configuración de temas (`src/index.css`) bajo los siguientes nombres de variables de Tailwind:

*   **Enchanted Green (`--color-enchanted-green` / `#0B3D2E`)**: Nuestro color primario de marca. Un verde bosque profundo que aporta madurez, seriedad y elegancia corporativa. En modo oscuro, se adapta para teñir el fondo principal con un matiz verde rico (`#051A14`).
*   **Elevated Gold (`--color-elevated-gold` / `#8C7853`)**: El color de acento principal. Representa precisión y calidad editorial, utilizado en bordes decorativos superiores, botones de acción primaria en modo oscuro y badges destacados.
*   **Light Ivory (`--color-light-ivory` / `#F2E9DF`)**: El color de fondo y superficie primario en modo claro. Un tono hueso cálido y sofisticado que descansa la vista y evita la fatiga de los fondos blancos genéricos.
*   **Cranberry (`--color-cranberry` / `#84344E`)**: Usado para alertas críticas, botones de eliminación y estados de confirmación pendientes.
*   **Rose Linen (`--color-rose-linen` / `#DFBDB5`)**: Un color rosado de fondo suave utilizado para contrastar las alertas y los badges de facturación pendiente.
*   **Rocky Gray (`--color-rocky-gray` / `#BBBCBC`)**: Color neutro apagado para textos secundarios, descripciones e indicadores deshabilitados.

### Tipografía Empleada
*   **Títulos y Encabezados**: Familia Serif de estilo editorial romano clásico para una identidad imponente y limpia.
*   **Interfaz General**: Sans-serif limpia (Inter) optimizada para máxima legibilidad en tablas densas de datos.
*   **Códigos y Metadatos**: JetBrains Mono para códigos de proyectos, RFCs y estampas de tiempo operativas.

---

## 2. Layout, Scrolling y Estructura del Contenedor
El sistema está diseñado para ofrecer una experiencia fluida que se siente como una aplicación de escritorio nativa en la web:

1.  **Límites de Pantalla Fijos**: El contenedor raíz de `App.tsx` y el elemento `html/body` están restringidos a `100vh` de altura y `100vw` de ancho con `overflow: hidden`.
2.  **Fondo Unificado**: El color de fondo correcto (Light Ivory en modo claro, Enchanted Green muy oscuro en modo oscuro) se aplica directamente al elemento raíz del documento a través de `src/index.css` para eliminar el espacio en blanco al final del scroll o en saltos de página.
3.  **Sidebar Fijo con Scroll Independiente**: El sidebar izquierdo permanece estático en pantallas de escritorio, pero su listado interno de módulos utiliza `overflow-y-auto` de forma que los enlaces son los que deslizan verticalmente, no la página entera.
4.  **Panel Principal de Contenido**: El contenedor derecho de la aplicación tiene scroll vertical independiente, aislando el movimiento del resto de la interfaz.

---

## 3. Módulo 1: Catálogo de Clientes (Fase 1)
Diseñado para la administración unificada de contactos corporativos:
*   **Campos**: Nombre Comercial, Razón Social, RFC (clave única), y Contacto (Teléfono/Email).
*   **Estado Vacío**: Ilustrado de manera sofisticada invitando al usuario a registrar su primer cliente. No contiene botones demo de autoinyección para mantener la pureza de los datos desde el nacimiento.
*   **Integridad de Datos**: Al eliminar un cliente, todos los proyectos asignados a ese cliente se eliminan en cas## 5. Módulo 3: Facturación y CFDIs (Fase 3)
El módulo de facturación administra el registro y control de comprobantes fiscales digitales (CFDI), retenciones, y la cartera de cobros vinculados a los códigos de proyecto operativos:

### Especificación de Datos (Modelo `Invoice`)
*   `folio` (Texto, Requerido): Identificador alfanumérico real del CFDI (ej. "IX01"), capturado manualmente por el usuario.
*   `proyectoId` (Referencia, Requerida): Llave foránea que asocia la factura con un proyecto registrado. Si no hay proyectos, el formulario orienta amigablemente a crear uno primero.
*   `subtotal` (Número, Requerido): Base gravable de la factura.
*   `iva` (Número): IVA (16%) calculado automáticamente al ingresar el subtotal, pero editable manualmente para permitir ajustes exactos de redondeo de centavos del CFDI timbrado.
*   `retencionIsr` (Número, Opcional): Retención de ISR federal que se resta del total final. Por defecto inicia en `0`.
*   `retencionIva` (Número, Opcional): Retención de IVA que se resta del total final. Por defecto inicia en `0`.
*   `total` (Solo lectura): Calculado en tiempo real mediante la fórmula: `subtotal + iva - retencionIsr - retencionIva`.
*   `metodoPago` (Selección de opción): PUE (Pago en una sola exhibición) o PPD (Pago en parcialidades o diferido).
*   `complementoEmitido` (Booleano, Condicional): Si el método es PPD, se muestra este campo para controlar si ya se emitió el complemento de recepción de pago. Si es PUE, el campo se oculta automáticamente.
*   `estado`: Nace por defecto en estado `facturada` (sin cobrar).
*   `fechaEmision` (Selector manual): Fecha real en que se timbró el CFDI (permite registrar facturas pasadas).
*   `fechaPago` (Selector manual al cobrar): Fecha real en que el cliente depositó en bancos. Se solicita al momento de cambiar el estado de la factura de `facturada` a `pagada`, pre-llenado en la hora local de la Ciudad de México pero editable.

### Características de Interfaz y Filtros
1.  **Tablero de Cuentas por Cobrar (KPI Cards)**:
    *   **Total Facturado**: Suma del importe neto (`total`) de todos los CFDIs emitidos.
    *   **Total Pagado / Cobrado**: Suma del importe neto de aquellos CFDIs cuyo estado es `pagada` (dinero en bancos).
    *   **Pendiente de Cobro**: Diferencia neta por recuperar (cartera de clientes activa).
2.  **Filtro Crítico "PPD sin complemento"**: Un filtro de un solo clic que aísla instantáneamente los CFDIs que requieren la emisión urgente del complemento de pago ante el SAT (Método PPD con `complementoEmitido` = No).
3.  **Lógica Pura de Cálculo de Estatus de Proyecto**: El estatus de facturación de cada proyecto se calcula dinámicamente como una función pura para asegurar la portabilidad e integridad de los datos en la base de datos futura:
    *   **Sin facturar**: El proyecto no tiene ningún CFDI registrado.
    *   **Facturado**: El proyecto tiene al menos un CFDI registrado, pero uno o más siguen pendientes de pago.
    *   **Pagado**: El proyecto tiene al menos un CFDI y TODOS se encuentran marcados como `pagada` (liquidados al 100%).
4.  **Integración en Ficha de Proyecto**: En el panel lateral detallado del Módulo de Proyectos, la sección anteriormente estática "Facturas vinculadas" ahora despliega en tiempo real el listado con los folios, fechas de emisión, método de pago, importes y badges de cobro correspondientes al proyecto inspeccionado.

---

## 6. Módulo 4: Control de Gastos y Egresos (Fase 4)
El módulo de Gastos administra el registro de egresos generales, compras de operación diaria y costos directos de proveedores vinculados a proyectos específicos:

### Especificación de Datos (Modelo `Expense`)
*   `tipo` (Selector, Requerido): `Operativo` (sin proyecto) o `Proveedor por Proyecto` (asociado a un código específico).
*   `proyectoId` (Referencia Condicional): Requerido solo si el tipo es `Proveedor por Proyecto`. Si se elige esta opción sin proyectos registrados, el formulario guía al usuario a registrar uno primero.
*   `categoriaId` (Selector, Requerido): Una de las 12 categorías preestablecidas (ej. Pago a proveedores, Viáticos, etc.).
*   `concepto` (Texto libre, Requerido): Descripción libre o razón comercial del establecimiento/proveedor.
*   `subtotal` (Número, Requerido): Base del gasto.
*   `iva` (Número): 16% autocalculado, pero modificable manualmente para concordar con los centavos de la factura recibida.
*   `isrRetenido` / `ivaRetenido` (Número, Opcional): Retenciones manuales que se deducen del total neto del egreso.
*   `total` (Solo lectura): Calculado automáticamente en tiempo real (`subtotal + iva - isrRetenido - ivaRetenido`).
*   `cuentaOrigen` (Selector, Requerido): Origen de los fondos (San, Ale, o Empresa).
*   `esReembolsable` (Booleano): Toggle para clasificar si requiere un reintegro.
*   `tieneFactura` (Booleano): Registro de si se cuenta con el XML/PDF oficial.
*   `metodoPago` (Selector): Transferencia, Tarjeta de Débito o Efectivo.
*   `estatusPago` (Selector): Pagado o Pendiente.
*   `fecha` (Fecha, Requerida): Selector de calendario que por defecto carga el día actual en la zona horaria de la Ciudad de México.

### Características de Interfaz y Filtros
1.  **KPIs de Egresos**:
    *   **Total Acumulado**: Suma absoluta de egresos registrados en el sistema.
    *   **Egresos Liquidados**: Suma de egresos cuyo estatus de pago es `Pagado`.
    *   **Pendiente de Pago**: Cartera pendiente por fondear.
2.  **Filtros Multi-dimensión**: Búsqueda libre por concepto, y selectores independientes por Categoría, Cuenta Origen, Proyecto Vinculado y Estatus de Pago.
3.  **Integración en Ficha de Proyecto**: Despliega en vivo los gastos específicos de proveedores vinculados en el panel lateral de detalles de Proyectos, mostrando concepto, fecha, total, categoría y estatus de liquidación.
4.  **Integridad de Datos**: Al eliminar un proyecto, todos los gastos vinculados a él se eliminan automáticamente para evitar inconsistencias de relación en cascada.

---

## 7. Módulo 5: Pagos a Proveedores (Fase 5)
Este módulo gestiona de forma granular los pagos de egresos directos contratados a subcontratistas y proveedores logísticos clave de cada evento/proyecto.

### Especificación de Datos (Modelo `ProviderPayment`)
*   `proyectoId` (Referencia, Requerida): Código identificador del proyecto al que se asocian los servicios del proveedor. Si no hay proyectos, el sistema bloquea el registro con un aviso de advertencia.
*   `proveedor` (Texto libre, Requerido): Nombre comercial o razón social del subcontratista (ej. "Mobiliario Eventos SA").
*   `subtotal` (Número, Requerido): Subtotal de la transacción de egreso directo.
*   `iva` (Número): IVA calculado de manera automática al 16% sobre el subtotal, editable manualmente.
*   `isr_retenido` (Número, Opcional): Retención de ISR ingresada manualmente, por defecto $0.00.
*   `iva_retenido` (Número, Opcional): Retención de IVA ingresada manualmente, por defecto $0.00.
*   `total` (Número, Solo lectura): Monto total calculado automáticamente mediante la fórmula: `subtotal + iva - isr_retenido - iva_retenido`.
*   `tieneFactura` (Booleano): Casilla de verificación Sí/No sobre la disponibilidad del CFDI.
*   `estatus` (Selector): Estado de liquidación (`Pagado` / `Pendiente`).
*   `fecha` (Fecha, Requerida): Fecha del desembolso (por defecto la fecha local de CDMX, editable).

### Características y Filtros
1.  **KPI Cards de Monitoreo**:
    *   **Total Pagado a Proveedores**: Suma de los montos `total` de pagos con estatus `Pagado`.
    *   **Total Pendiente de Pago**: Suma de los montos `total` de pagos comprometidos con estatus `Pendiente`.
2.  **Filtros Interactivos**: Búsqueda por proveedor, y filtrado dinámico por Proyecto y Estatus de Pago.

---

## 8. Módulo 6: Pagos a Terceros — Yazu / Xiomara (Fase 5)
Permite el control financiero automatizado y la dispersión proporcional de ingresos provenientes de intermediaciones comerciales.

### Especificación de Datos (Modelo `ThirdPartyPayment`)
*   `proyectoId` (Referencia, Opcional): Proyecto comercial asociado, permitiendo seleccionar "Sin proyecto asociado" para registrar intermediaciones directas u operativas libres.
*   `concepto` (Texto libre, Requerido): Concepto de la transacción o descripción de la distribución.
*   `saldoOriginal` (Número, Requerido): Monto de entrada total recibido para ser dividido.
*   `comisionIntermediario` (Número, Solo lectura): Comisión calculada automáticamente (`saldoOriginal × 7.2727%`).
*   `gananciaIxAdicional` (Número, Solo lectura): Margen de ganancia calculado automáticamente (`saldoOriginal × 1.8182%`).
*   `montoADepositar` (Número, Solo lectura): Remanente neto neto a transferir al destinatario final (`saldoOriginal − comisionIntermediario − gananciaIxAdicional`).
*   `estatusPago` (Selector): Estado de transferencia (`Pagado` / `Pendiente`).
*   `fecha` (Fecha, Requerida): Fecha de registro o de depósito (CDMX local, editable).

### Fórmulas Matemáticas Centralizadas
*   **Comisión de Intermediario**: $f_{com}(s) = s \times 0.072727$
*   **Ganancia Adicional IX**: $f_{gan}(s) = s \times 0.018182$
*   **Monto Neto a Depositar**: $f_{dep}(s) = s - f_{com}(s) - f_{gan}(s)$

### Características y Filtros
1.  **Cálculos en Tiempo Real**: Los desgloses de retenciones se actualizan en vivo en la interfaz de registro conforme el usuario captura el Saldo Original, mostrando etiquetas informativas claras de "Calculado automáticamente".
2.  **Panel KPI Agregado**: Muestra en tiempo real la sumatoria acumulada de Saldos de Entrada, Comisión de Intermediario, Ganancia Adicional de IX y el Neto a Depositar.
3.  **Filtros**: Permite filtrar por concepto mediante barra de búsqueda, estatus de pago y proyectos asociados (o clasificar únicamente los operativos sin proyecto).

---

## 9. Módulo 7: Reparto de Utilidades (Fase 6)
Este módulo automatiza completamente el reparto del rendimiento económico neto de un proyecto al liquidarse las cobranzas correspondientes. No requiere de alta manual por parte del usuario, lo que previene errores operativos en la asignación de participaciones.

### Especificación de Datos y Modelo (`ProfitDistribution`)
*   `id` (Clave Única): Identificador alfanumérico secuencial autogenerado (`pd_...`).
*   `proyectoId` (Referencia, Requerida): Código identificador del proyecto liquidado al 100%.
*   `gananciaTotal` (Número, Solo lectura): Utilidad neta base del proyecto.
*   `gananciaDueno` (Número, Solo lectura): Participación fija asignada al Socio/Dueño de la firma (65%).
*   `gananciaEjecutivo` (Número, Solo lectura): Participación del Ejecutivo comercial asignado (30% o 35% según el estatus del fondo de Becas).
*   `gananciaDiploma` (Número, Solo lectura): Porcentaje del fondo de Becas/Diploma (5% o remanente limitado).
*   `fechaCreacion` (Fecha, Solo lectura): Estampa de tiempo en que ocurrió la liquidación del proyecto.

### Algoritmo y Lógica Pura de Cálculo de Distribución
La función pura de cálculo recibe los datos del proyecto, sus facturas registradas, los pagos liquidados de sus proveedores, y la sumatoria acumulada histórica de ganancia asignada a Diploma:

1.  **Cálculo de la Utilidad Operativa Base**:
    $$\text{Ganancia Total} = \sum (\text{Subtotal de Facturas}) - \sum (\text{Subtotal de Pagos a Proveedores})$$
    *Se omiten estrictamente los importes correspondientes al IVA, retenciones de ISR e IVA de ambos lados ya que representan flujo impositivo transitorio y no ganancia líquida corporativa.*

2.  **Porción Fija de Socio/Dueño**:
    $$\text{Ganancia Dueño} = \text{Ganancia Total} \times 0.65$$

3.  **Evaluación de la Regla de Límite y Reasiganción del Fondo de Becas/Diploma (Tope: $37,800.00 MXN)**:
    Se calcula dinámicamente el total acumulado histórico sumando las distribuciones en vivo. Se evalúa el impacto de la porción propuesta para Diploma ($P_{diploma} = \text{Ganancia Total} \times 0.05$):

    *   **Caso A: Fondo de Becas previamente topado**:
        Si el acumulado histórico es $\ge \$37,800.00$:
        $$\text{Ganancia Diploma} = 0.00$$
        $$\text{Ganancia Ejecutivo} = \text{Ganancia Total} \times 0.35$$
        *(El 5% propuesto completo se suma a la porción ordinaria del 30% del Ejecutivo).*

    *   **Caso B: Margen de acumulación suficiente**:
        Si el acumulado histórico más la propuesta de reparto es $\le \$37,800.00$:
        $$\text{Ganancia Diploma} = P_{diploma}$$
        $$\text{Ganancia Ejecutivo} = \text{Ganancia Total} \times 0.30$$

    *   **Caso C (Caso Límite - Tránsito al tope)**:
        Si el acumulado histórico está por debajo del límite, pero el $5\%$ propuesto causaría un excedente:
        $$\text{Ganancia Diploma} = \$37,800.00 - \text{Acumulado Previo}$$
        $$\text{Excedente Sobrante} = P_{diploma} - \text{Ganancia Diploma}$$
        $$\text{Ganancia Ejecutivo} = (\text{Ganancia Total} \times 0.30) + \text{Excedente Sobrante}$$
        *(La porción de Diploma se reduce para llegar exactamente al límite y la diferencia residual se transfiere directamente a la utilidad del Ejecutivo en la misma transacción).*

### Disparador de Flujo Operativo Automatizado
*   **Evento Gatillo**: Confirmación de cobro en la ventana emergente ("Marcar factura como pagada").
*   **Condición**: Al actualizarse el listado de facturas, el sistema evalúa la función pura de estado de facturación del proyecto. Si el proyecto transita a estado **"Pagado"** (todas sus facturas cobradas) **Y** no existe previamente una distribución de utilidad para dicho proyecto, el sistema gatilla el algoritmo y crea de manera duradera el objeto de `ProfitDistribution` en el almacenamiento local persistente de React.

### Consola de Monitoreo de Utilidades (UI)
1.  **Tarjetas Métricas Integradas**:
    *   *Utilidad Total Generada*: Suma del histórico neto distribuido.
    *   *Acumulado Dueño (65%)*: Retornos acumulados para el capital accionario de la firma.
    *   *Acumulado Ejecutivo*: Retornos acumulados para el equipo comercial de ejecución.
    *   *Fondo Diploma (Becas 5%)*: Despliegue en tiempo real de los fondos capturados contra la meta fija de $\$37,800.00$ acompañada de una barra de progreso visual de porcentaje de avance.
2.  **Lista Detallada con Filtro**: Visualización estructurada con búsqueda reactiva por texto libre sobre nombres de clientes o títulos de proyectos.
3.  **Ficha de Proyecto**: Panel colapsable de detalles que muestra en tiempo real la estampa del reparto o el badge **"Pendiente"** de liquidación.

---

## 11. Módulo de Por Impactar (Fase 7)
Este módulo permite a la firma registrar y controlar gastos operativos provisionales pagados inicialmente de forma directa por los socios o la empresa, con el fin de ser recuperados o reasignados en el futuro a su proyecto definitivo mediante el proceso de "Resolución":

### Especificación de Datos (Modelo `PorImpactar`)
*   `descripcion` (Texto libre, Requerido): Concepto descriptivo del egreso provisional.
*   `monto` (Número simple, Requerido): Importe bruto sin desglose impositivo de IVA (este desglose se realiza al resolver).
*   `socioResponsable` (Selección de opción, Requerido): Quién desembolsó originalmente los fondos (San / Ale / Empresa).
*   `proyectoOrigenId` (Referencia Opcional): El proyecto donde se originó el gasto provisorio (campo meramente informativo).
*   `fecha` (Fecha, Requerida): Fecha en que se efectuó el pago.
*   `estatus` (Estado, Autoadministrado): Inicia como `pendiente` y cambia a `resuelto` una vez que el registro ha sido vinculado a un proyecto definitivo.
*   `proyectoDestinoId` (Referencia Condicional): Se llena únicamente cuando el estado pasa a `resuelto` (ID del proyecto definitivo al que impactará el gasto).
*   `gastoIdGenerado` (Referencia Interna): Enlace directo al objeto `Expense` creado automáticamente durante la resolución.

### El Proceso de "Resolución" (Conversión a Gasto)
Al presionar la acción "Resolver" sobre un registro pendiente:
1.  **Formulario Guiado**: Se abre una interfaz similar al alta de Gastos, pre-llenada con los datos del registro (`concepto` heredado de la descripción, `subtotal` heredado del monto, y `cuentaOrigen` heredada del socio responsable).
2.  **Selección Obligatoria**: Se solicita seleccionar de forma obligatoria el proyecto destino (`proyecto_destino`), clasificar la categoría fiscal de gastos, y capturar manualmente el desglose de IVA y retenciones si aplican.
3.  **Generación y Vinculación Automática**:
    *   Se inserta un nuevo registro de tipo `Expense` con el tipo fijo de "Proveedor por Proyecto".
    *   El registro original de `PorImpactar` actualiza su `estatus` a `resuelto`, guarda la referencia del `proyectoDestinoId`, y almacena el identificador del nuevo gasto en `gastoIdGenerado`.

### Integración en Ficha de Proyecto
En la Ficha de Proyecto del Módulo de Proyectos, se añade una sección titulada **"Por Impactar resueltos"** que despliega en tiempo real todos los egresos provisionales resueltos cuyo `proyectoDestinoId` apunte a dicho proyecto, garantizando total trazabilidad y control sobre los costos agregados del evento.

### Reversión al Eliminar Gastos Vinculados
Cuando un usuario elimina un Gasto desde el módulo de Control de Gastos:
1.  **Validación de Origen**: Se verifica de manera transparente si existe algún registro del catálogo de **Por Impactar** vinculado a dicho gasto (donde `gastoIdGenerado` coincida con el identificador del gasto a eliminar).
2.  **Confirmación Contextual**: Si existe un registro vinculado, se despliega una interfaz de confirmación personalizada que detalla la relación existente y advierte al usuario de la reversión inminente:
    > *"Este gasto se generó al resolver un registro de Por Impactar ('[descripción]', $[monto]). Al eliminarlo, ese registro volverá a estado Pendiente. ¿Confirmar?"*
3.  **Proceso de Reversión**:
    *   Se elimina el Gasto de forma ordinaria.
    *   El registro de **Por Impactar** asociado se actualiza, reestableciendo su estatus a `pendiente`.
    *   Se limpian los campos correspondientes a la vinculación (`proyectoDestinoId` y `gastoIdGenerado` se reestablecen a nulos), devolviendo el registro provisorio a su estado original sin perder la trazabilidad de los egresos no concluidos.
4.  **Gastos Ordinarios**: Para gastos no vinculados a Por Impactar, el borrado se efectúa de manera directa e instantánea sin alterar el flujo usual.

### Interfaz de Alta Mejorada (Previsualización con IVA)
Para garantizar una captura clara de la información financiera antes del proceso de resolución:
1.  **Nota Aclaratoria**: Se ha integrado debajo del campo de captura de `Monto` una leyenda que explicita que la cifra registrada actuará como Subtotal (libre de IVA) al momento de convertirlo en Gasto.
2.  **Caja de Previsualización en Tiempo Real**: Justo debajo de la nota, se incluye una caja de lectura en tiempo real con fondo degradado de color y borde de alta legibilidad que estima de inmediato el "Total estimado con IVA" (Monto original × 1.16), manteniendo completa paridad con la experiencia visual de cálculo impositivo del resto de los módulos del ecosistema.

---

## Fase 8: Análisis de Rentabilidad

Consola de análisis financiero para la salud y el control de márgenes, de carácter puramente calculado y de **solo lectura** (no requiere formularios de alta). Permite estimar en tiempo real los márgenes netos basados en cifras puras sin considerar impuestos (IVA), puesto que el IVA no constituye ganancia del negocio.

### 1. Fórmulas de Cálculo Puro

Las operaciones de cálculo se definen en funciones puras e independientes de la UI (`/src/utils/profitability.ts`) con tipado estricto y docstrings auto-explicativos:

#### Rentabilidad por Proyecto
Para un proyecto determinado:
*   `costo_cliente` = Suma de todos los `subtotal` de las facturas (`invoices`) asociadas al proyecto, sin importar el estatus de cobro (`facturada` o `pagada`), para asegurar un panorama del volumen total comprometido.
*   `costo_proveedor` = Suma de todos los `subtotal` de los pagos a proveedores (`providerPayments`) vinculados al proyecto, independientemente de si están `Pagado` o `Pendiente`.
*   `gastos_proveedor_vinculados` = Suma de todos los `subtotal` de los gastos ordinarios (`expenses`) asociados al proyecto con el tipo `"Proveedor por Proyecto"`, sin importar su estatus de pago.
*   `ganancia` = `costo_cliente - costo_proveedor - gastos_proveedor_vinculados`.
*   `porcentaje_rentabilidad` = `(ganancia / costo_cliente) * 100`, redondeado a 1 decimal. Si el `costo_cliente` es cero, se muestra como `"N/A"` para evitar divisiones entre cero.

#### Rentabilidad por Cliente
Para un cliente determinado:
*   Suma de la `ganancia` calculada para todos los proyectos del cliente.
*   Suma del `costo_cliente` acumulado para todos sus proyectos.
*   `porcentaje_rentabilidad_acumulado` = `(gananciaTotal / costoClienteTotal) * 100`, redondeado a 1 decimal (muestra `"N/A"` si el costo total es cero).

### 2. Estructura de la Interfaz del Módulo
El módulo "Rentabilidad" se compone de dos pestañas de visualización ágil:

1.  **Por Proyecto**:
    *   **KPIs Superiores**: Tarjetas que resumen la Ganancia Total Acumulada, el Facturado Clientes (Subtotales acumulados) y la Rentabilidad Promedio de los proyectos activos.
    *   **Tabla Detallada**: Columnas de Proyecto, Cliente, Costo Cliente, Costo Proveedor, Gastos Proveedor Vinculados, Ganancia, y Porcentaje de Rentabilidad.
    *   **Buscador**: Entrada responsiva para filtrar por nombre de proyecto, código de proyecto o cliente.
2.  **Por Cliente**:
    *   **Tabla Detallada**: Columnas de Cliente, Número de Proyectos, Costo Cliente Acumulado, Costo Proveedor Acumulado, Gastos Proveedor Vinculados Acumulados, Ganancia Acumulada, y Rentabilidad Agregada.
    *   **Buscador**: Entrada responsiva para filtrar por nombre del cliente.

### 3. Vínculo con Ficha de Proyecto
En el Módulo de Proyectos, al seleccionar una fila para ver el detalle lateral (**Ficha de Proyecto**), se ha habilitado un bloque de **"Rentabilidad del Proyecto"** que consume las fórmulas del punto 1 para desplegar de forma interactiva y en tiempo real el desglose de Costo Cliente, Costo Proveedor, Gastos Proveedor Vinc., Ganancia Neta, y el Porcentaje de Rentabilidad con semáforo de colores.

### 4. Nota sobre Scope de Ejecutivo Diferido
> **Nota de Scope (Fase 11)**: De conformidad con el PRD, las visualizaciones, asignaciones, reportes o comisiones avanzadas segmentadas de ejecutivos de cuenta para el cálculo de rentabilidad diferido se reservan en su totalidad para la **Fase 11**. La rentabilidad actual consolida la totalidad de operaciones generales y de clientes de la plataforma de forma integral.

---

## Fase 9: Panel de IVA

Consola de control de flujo tributario y cálculo del Impuesto al Valor Agregado (IVA). Al igual que el módulo de rentabilidad, es de **solo lectura** y de carácter estrictamente calculado en tiempo real (no requiere un formulario de alta).

### 1. Fórmulas de Cálculo Puro
Las operaciones de cálculo se definen en funciones puras e independientes de la UI (`/src/utils/iva.ts`) con tipado estricto y docstrings auto-explicativos:

*   **IVA Trasladado (`iva_trasladado`)**: Suma de la columna `iva` de todas las Facturas (`invoices`) del sistema, sin importar si su estado es `facturada` o `pagada` (panorama de obligaciones completo).
*   **IVA Acreditable Gastos (`iva_acreditable_gastos`)**: Suma de la columna `iva` de todos los Gastos ordinarios (`expenses`) del sistema donde `tieneFactura === true`. Aquellos gastos sin comprobante fiscal son ignorados por no ser fiscalmente acreditables.
*   **IVA Acreditable Proveedores (`iva_acreditable_proveedores`)**: Suma de la columna `iva` de todos los Pagos a Proveedores (`providerPayments`) del sistema donde `tieneFactura === true`. Aquellos pagos sin factura son ignorados.
*   **IVA Acreditable Total (`iva_acreditable_total`)**: `iva_acreditable_gastos + iva_acreditable_proveedores`.
*   **Diferencia de IVA (`diferencia`)**: `iva_trasladado - iva_acreditable_total`.
    *   **Obligación de Pago**: Si la diferencia es positiva, se etiqueta dinámicamente como **"A Pagar al SAT"** con color de alerta (`Cranberry`).
    *   **Saldo a Favor**: Si la diferencia es negativa o cero, se etiqueta como **"Saldo a Favor"** con color neutral/positivo (`Enchanted Green`), mostrando el valor absoluto.

*Nota impositiva: En esta fase, las retenciones de IVA u otros impuestos especiales se ignoran para simplificar el cálculo consolidado básico.*

### 2. Estructura de la Interfaz del Módulo
La pantalla del **Panel de IVA** se compone de las siguientes secciones optimizadas:
1.  **Tarjetas KPI Principales**:
    *   **IVA Trasladado**: Suma de IVA cobrado o por cobrar a clientes.
    *   **IVA Acreditable**: Suma de IVA pagado a proveedores o en gastos operativos.
    *   **Diferencia Dinámica**: Tarjeta con fondo destacado y semáforo de colores adaptativo según sea balance a pagar u obtenido a favor.
2.  **Desglose de Origen**:
    *   Sección detallada que expone cuánto IVA acreditable provino de la contabilidad de **Gastos** y cuánto de **Pagos a Proveedores**, promoviendo un rastro de auditoría rápido.
3.  **Tarjeta de Fundamento Fiscal (SAT)**:
    *   Bloque informativo con colores corporativos que aclara el criterio de acreditación exclusivamente para egresos comprobados mediante CFDI.

### 3. Nota sobre Restricción de Visibilidad
> **Nota de Scope (Fase 11)**: De conformidad con el PRD, las políticas avanzadas de restricción de visibilidad según roles de usuario (por ejemplo, "Sólo visible para Dueño") quedan diferidas y pendientes en su totalidad para la **Fase 11** de control de accesos y seguridad general. Actualmente, la consola se encuentra disponible de forma integrada para el análisis estratégico de los socios comerciales.

---

## Fase 10: Reportes

Consola estratégica para la descarga de auditorías y conciliaciones financieras completas por cada proyecto en formato Microsoft Excel (`.xlsx`), procesado en su totalidad del lado del cliente.

### 1. Fórmulas de Cálculo y Consolidación por Proyecto
Se implementan funciones de cálculo puras e independientes (`/src/utils/reports.ts`) para compilar los balances contables de un proyecto individual:

*   **IVA Trasladado por Proyecto (`iva_trasladado`)**: Suma de la columna `iva` de todas las Facturas (`invoices`) asociadas al proyecto, sin importar su estatus de cobro.
*   **IVA Acreditable por Proyecto (`iva_acreditable_total`)**: Suma de la columna `iva` de todos los Gastos (`expenses`) y Pagos a Proveedores (`providerPayments`) vinculados al proyecto donde `tieneFactura === true`.

### 2. Estructura Multioja de la Exportación Excel (.xlsx)
Cada archivo descargado se nombra sistemáticamente bajo el patrón `Reporte_[código_proyecto]_[nombre_proyecto].xlsx` e incluye cuatro hojas de trabajo detalladas:

1.  **Hoja "Resumen"**: Concentra los metadatos generales del proyecto, el resumen de erogaciones (Costo Cliente, Costo Proveedor, Gastos Proveedor Vinculados, Ganancia Neta, % de Rentabilidad) y el balance de impuestos (IVA Trasladado, IVA Acreditable de Gastos y Proveedores, Diferencia e indicación dinámica de obligación ante el SAT).
2.  **Hoja "Facturas"**: Contiene el listado completo de facturas emitidas para el proyecto con todos sus campos (Folio, Subtotal, IVA, Retención ISR, Retención IVA, Total, Método de pago, Complemento para PPD, Estado, Fecha de Emisión y Fecha de Pago).
3.  **Hoja "Gastos"**: Bitácora de gastos operativos y erogaciones de tipo `"Proveedor por Proyecto"` vinculados al proyecto con desglose de retenciones e IVA.
4.  **Hoja "Pagos a Proveedores"**: Historial de transacciones de egreso a contratistas del proyecto con desglose de importes y estatus de pago.

### 3. Puntos de Acceso e Integraciones
*   **Ficha de Proyecto**: Se ha integrado un botón de acción `"Descargar Reporte Excel"` en el panel lateral de detalles del proyecto, facilitando descargas ágiles directas con un solo clic.
*   **Consola dedicada "Reportes"**: Se ha activado el módulo en el sidebar que despliega un motor de búsqueda de proyectos. Al seleccionar cualquier proyecto coincidente, expone la estructura interna del libro de cálculo que se descargará y ofrece el gatillo de descarga directa.

### 4. Nota sobre Restricción de Visibilidad de Reportes
> **Nota de Scope (Fase 11)**: De conformidad con el PRD, las políticas de permisos para restringir la descarga de reportes contables únicamente a usuarios con rol de "Dueño" o administradores se delegan para su desarrollo integral en la **Fase 11**. Actualmente, todos los socios y gestores pueden compilar la información para sus respectivas operaciones.