Contexto y Estándares del Proyecto (Node.js & Vue 3)
Stack Tecnológico
El proyecto se divide en dos entornos independientes, comunicados a través de peticiones HTTP:
Backend (API REST): Node.js (LTS), Express.js, MongoDB con Mongoose (ODM). Lenguaje JavaScript Puro (ES6+) bajo el sistema de módulos ESM. No se utiliza TypeScript.
Frontend (Cliente): Vue 3 (Composition API), Vite, y Quasar Framework.
________________________________________
Estructura de Carpetas
La arquitectura está separada en dos directorios principales para mantener la independencia entre el servidor y el cliente.
Zona Backend (Num-Back)
Contiene toda la lógica del servidor, API y base de datos. Nota: No utiliza carpeta /src contenedora.
•	/controllers: Lógica de negocio y procesamiento de las peticiones (req, res).
•	/database: Archivos de configuración y conexión a MongoDB.
•	/helpers: Funciones de apoyo, utilidades generales y formateadores de datos.
•	/middlewares: Funciones intermedias (validación de tokens, manejo global de errores).
•	/models: Esquemas y modelos de datos de Mongoose.
•	/routes: Definición de los endpoints de Express y asignación de controladores.
•	app.js: Archivo principal de entrada, inicialización de Express y middlewares globales.
•	endpoints.json: Colección o documentación de las rutas de la API.
•	.env: Variables de entorno (puertos, cadenas de conexión, secretos).
•	
Zona Frontend (Num-Front)
Contiene la interfaz de usuario.
•	/public: Archivos estáticos que no pasan por el proceso de compilación.
•	/src/assets: Recursos multimedia (imágenes, fuentes, iconos).
•	/src/components: Componentes visuales reutilizables (botones, modales, tarjetas).
•	/src/composables: Lógica reactiva reutilizable usando Composition API.
•	/src/layouts: Estructuras base de las páginas (ej. el contenedor principal con el menú).
•	/src/plugins: Configuración e inicialización de librerías externas.
•	/src/router: Configuración de navegación y protección de rutas.
•	/src/services: Lógica para consumir la API REST del backend (peticiones HTTP).
•	/src/store: Gestor de estado global de la aplicación.
•	/src/styles: Hojas de estilo globales y variables CSS/SASS.
•	/src/utils: Funciones utilitarias específicas del lado del cliente.
•	/src/views: Vistas principales o páginas completas de la aplicación.
Reglas de Código (Backend - Estilo ES6)
1.	Módulos ESM: Usar estrictamente la sintaxis import x from 'y' y export. Queda prohibido el uso de require o module.exports.
2.	Asincronía Moderna: Utilizar exclusivamente async/await para el manejo de promesas. Evitar la sintaxis encadenada de .then() y .catch().
3.	Manejo de Errores Centralizado: En los controladores, toda la lógica debe estar envuelta en un bloque try/catch. Cualquier error capturado debe delegarse al middleware global utilizando next(error).
4.	Inmutabilidad por Defecto: Declarar variables usando const. Utilizar let única y exclusivamente cuando el valor deba ser reasignado dinámicamente. Nunca usar var.
5.	Funciones de Flecha: Preferir las Arrow Functions (() => {}) para la creación de middlewares, controladores y funciones utilitarias.
6.	Nomenclatura Estricta: Utilizar camelCase para nombrar variables, constantes y funciones (ej. obtenerReporteMensual, datosUsuario).
Convenciones de Base de Datos (Mongoose)
1.	Nombres de Modelos: Los archivos de los modelos deben nombrarse en singular y utilizar PascalCase (ej. Supervisor.js, Reporte.js).
2.	Trazabilidad: Es obligatorio incluir la opción timestamps: true al final de cada Schema para generar automáticamente los campos de auditoría createdAt y updatedAt.
3.	Validación Fuerte: Todos los campos obligatorios del esquema deben utilizar la propiedad required acompañada de un mensaje de error personalizado (ej. required: [true, 'El número de documento es obligatorio']).
