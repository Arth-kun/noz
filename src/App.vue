<template>
  <router-view/>
</template>

<style>
body, html {
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}

.layout {
  width: 100%;
  min-height: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 50px 0 100px 0;
}

.col {
  width: 25vw;
}

@media (max-width: 499px) {
  .col{
    width: 90vw;
  }
}

@media (min-width: 500px) and (max-width: 799px) {
  .col{
    width: 65vw;
  }
}

@media (min-width: 800px) and (max-width: 1199px) {
  .col{
    width: 45vw;
  }
}

@media (min-width: 1200px) and (max-width: 1499px) {
  .col{
    width: 35vw;
  }
}
.centered {
  text-align: center;
}

.p-float-label {
  margin-bottom: 30px;
}

.p-component, .p-inputtext {
  font-family: Arial, sans-serif !important;
}

.p-float-label label {
  margin-top: 0;
  top: 37%;
}

.p-inputtext.p-component {
  width: 100%;
}

.p-dropdown.p-component.p-inputwrapper {
  width: 100%;
}

.pi-spinner {
  margin-left: 20px;
}

.p-message-info {
  max-width: 50%;
}

.p-button-label {
  font-weight: 700;
}
</style>
