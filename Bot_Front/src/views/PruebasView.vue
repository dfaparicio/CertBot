<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center column q-gutter-md">
        <h1>VISTA DE PRUEBAS (TEMPORAL)</h1>
        <p>Selecciona una vista para verificar que carga correctamente:</p>
        <div class="column q-gutter-sm">
          <q-btn label="Ir a Login" color="black" to="/login" />
          <q-btn label="Ir a Registro" color="blue" to="/register" />
          <q-btn label="Ir a Reportes" color="green" to="/reports" />
          <q-btn label="Ir a Supervisor" color="red" to="/supervisor" />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>