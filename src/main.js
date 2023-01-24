import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Tooltip from 'primevue/tooltip';
import Checkbox from 'primevue/checkbox';

import App from './App.vue';
import router from './router';
import store from './store';

createApp(App)
  .use(store)
  .use(router)
  .use(PrimeVue, {
    locale: {
      dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
      dayNamesShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      dayNamesMin: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      monthNames: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
      monthNamesShort: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin","Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"],
      firstDayOfWeek: 1,
    }
  })
  .directive('tooltip', Tooltip)
  .component('Dropdown', Dropdown)
  .component('Button', Button)
  .component('InputText', InputText)
  .component('InputNumber', InputNumber)
  .component('Message', Message)
  .component('Calendar', Calendar)
  .component('Checkbox', Checkbox)
  .mount('#app');

Date.prototype.addDays = function(days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.isBetween = function(min, max) {
  return this.getTime() >= min.getTime() && this.getTime() <= max.getTime();
}