import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Select from 'primevue/select';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Tooltip from 'primevue/tooltip';
import Checkbox from 'primevue/checkbox';
import FloatLabel from 'primevue/floatlabel';

import App from './App.vue';
import router from './router';
import store from './store';

createApp(App)
  .use(store)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode-class',
          cssLayer: false
      },
    },
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
  .component('Dropdown', Select)
  .component('Button', Button)
  .component('InputText', InputText)
  .component('InputNumber', InputNumber)
  .component('Message', Message)
  .component('Calendar', DatePicker)
  .component('Checkbox', Checkbox)
  .component('FloatLabel', FloatLabel)
  .mount('#app');

Date.prototype.addDays = function(days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.isBetween = function(min, max) {
  return this.getTime() >= min.getTime() && this.getTime() <= max.getTime();
}