import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';
import store from './store';

createApp(App)
  .use(store)
  .use(router)
  .use(PrimeVue)
  .directive('tooltip', Tooltip)
  .component('Dropdown', Dropdown)
  .component('Button', Button)
  .component('InputText', InputText)
  .component('InputNumber', InputNumber)
  .component('Message', Message)
  .component('Calendar', Calendar)
  .mount('#app');
