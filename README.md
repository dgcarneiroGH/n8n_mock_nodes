# Entorno Local de Pruebas para n8n (Filtro de Organismos)

Este entorno permite probar y refactorizar la lógica del nodo "Code" de n8n directamente en tu ordenador usando Node.js, sin necesidad de consumir recursos ni hacer peticiones reales en tu flujo.

## 📁 Estructura de Carpetas Necesaria

Asegúrate de tener la siguiente estructura antes de ejecutar el script:

```text
/ (tu carpeta raíz)
 ├── subvenciones_client_version/
 │     └── 01_filter_organismos.js   <-- Script principal de lógica
 └── results/
      ├── get_organizations.json   <-- Datos mock del nodo BDNS
      └── get_clients.json         <-- Datos mock del nodo Notion
```

## ⚙️ Funcionamiento

1. **Carga de datos mock:** El script lee los archivos JSON de la carpeta `results` para simular la entrada de datos que recibiría el nodo en n8n.
2. **Procesamiento:** Aplica la lógica de filtrado y emparejamiento de organismos y clientes, usando diccionarios de sinónimos y palabras excluidas.
3. **Resultado:** Genera un archivo `filter_organismos.json` en la carpeta `results` con la salida procesada, igual que lo haría el nodo en n8n.

## 🚀 ¿Cómo migrar la lógica a un nodo de n8n?

1. Una vez validado el funcionamiento local, copia el contenido de la sección principal del script (desde `// --- INICIO DE LA LÓGICA DEL NODO ---` hasta `// --- FIN DE LA LÓGICA DEL NODO ---`).
2. Pega ese bloque en un nodo "Code" de n8n (JavaScript), adaptando la entrada/salida a los objetos `items` y `return items` según la documentación de n8n.
3. Sustituye la lectura/escritura de archivos por el uso de los datos que recibe el nodo y devuelve como resultado.

Así puedes desarrollar, depurar y validar la lógica de forma rápida y segura antes de integrarla en tu flujo de n8n.

## ▶️ Ejecución del flujo completo

Para ejecutar todos los scripts en orden y generar todos los archivos de resultados automáticamente, utiliza el script `run_all.js`:

```bash
cd subvenciones_client_version
node run_all.js
```

Esto ejecutará todos los pasos en orden (01, 02, 03, 04, 05 etc.) y detendrá el proceso si ocurre algún error.