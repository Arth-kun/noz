<template>
  <Header />
  <div class="layout">
    <span class="p-float-label">
      <Dropdown 
        id="formationType" 
        v-model="formationType" 
        :options="formationTypes" 
        :optionDisabled="formationTypes.length === 1"
      />
      <label for="formationType">Type de formation</label>
    </span>
    <span class="only-type" v-if="formationTypes.length === 1">
      Vous ne pouvez choisir que le type "{{formationType}}"
    </span>
    <span class="p-float-label" v-if="formationType === 'Mercato'">
      <Dropdown 
        id="targetJob" 
        v-model="targetJob" 
        :options="jobs"
      />
      <label for="targetJob">Poste visé</label>
    </span>
    <span class="duration">
      {{ `Durée de la formation : ${duration === 0 ? '?' : duration} semaines`}}
    </span>
    <span class="p-float-label">
      <Dropdown 
        id="askContract" 
        v-model="askContract" 
        :options="askContractOptions"
      />
      <label for="askContract">Demande de contrat</label>
    </span>
    <span class="p-float-label">
      <Calendar 
        id="beginDate" 
        v-model="beginDate" 
        :disabledDates="invalidDates"
        :disabledDays="invalidDays"
        :minDate="new Date()"
        dateFormat="dd/mm/yy"
        v-tooltip.focus="'Vous ne pouvez choisir que les mardi de semaines impaires'"
      />
      <label for="beginDate">Date de début</label>
    </span>
    <span class="p-float-label" v-if="beginDate !== '' && duration !== 0">
      <Dropdown 
        id="firstStore" 
        v-model="firstStore" 
        :options="formatedStoreList"
        optionLabel="label"
        optionValue="value"
      />
      <label for="firstStore">Magasin parrain</label>
    </span>
    <!--
    <span class="p-float-label">
      <InputText id="firstname" type="text" v-model.trim="firstname" />
      <label for="firstname">Prénom</label>
    </span>
    <span class="p-float-label">
      <Dropdown id="zone" v-model="zone" :options="zones" />
      <label for="zone">Zone</label>
    </span>
    <span class="p-float-label">
      <Dropdown id="xp" v-model="xp" :options="xps" />
      <label for="xp">Expérience de plus de 2 ans chez Noz ?</label>
    </span>
    <span class="p-float-label">
      <Dropdown id="contract" v-model="contract" :options="contracts" />
      <label for="contract">Type de contrat actuel</label>
    </span>
    <span class="p-float-label">
      <Dropdown id="society" v-model="society" :options="societies" />
      <label for="society">Société d'appartenance</label>
    </span>
    <span class="p-float-label">
      <Dropdown id="job" v-model="job" :options="jobs" />
      <label for="job">Fonction actuelle</label>
    </span>
    <div>
      <Button 
        label="Suivant" 
        :disabled="!canSavePerson" 
        @click="createPerson({ firstname, lastname, zone, society, job, xp })"
      />
      <i class="pi pi-spin pi-spinner" style="fontSize: 2rem" v-if="status === 'sending'"></i>
    </div>
    <div class="error" v-if="status === 'error'">
      Une erreur est survenue, merci de de remonter ce problème s'il persiste.
    </div> -->
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Header from '../components/Header.vue';

function getWeekNumber( d ) { 

  // Create a copy of this date object  
  var target  = new Date(d.valueOf());  
  
  // ISO week date weeks start on monday  
  // so correct the day number  
  var dayNr   = (d.getDay() + 6) % 7;  

  // Set the target to the thursday of this week so the  
  // target date is in the right year  
  target.setDate(target.getDate() - dayNr + 3);  

  // ISO 8601 states that week 1 is the week  
  // with january 4th in it  
  var jan4    = new Date(target.getFullYear(), 0, 4);  

  // Number of days between target date and january 4th  
  var dayDiff = (target - jan4) / 86400000;    

  // Calculate week number: Week 1 (january 4th) plus the    
  // number of weeks between target date and january 4th    
  var weekNr = 1 + Math.ceil(dayDiff / 7);    

  return weekNr;    

}

Date.prototype.addDays = function(days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

export default {
  name: 'CreateFormation',
  components: {
    Header
  },
  data() {
    return {
      formationTypes: [],
      jobs: [],
      askContractOptions : ['Oui', 'Non'],
      formatedStoreList: [],

      formationType: '',
      targetJob: '',
      askContract: '',
      beginDate: '',
      firstStore: '',

      invalidDates: [new Date()],
      invalidDays: [0, 1, 3, 4, 5, 6],
      startingRules: [],
      filteredRules: [],
      duration: 0
    }
  },
  methods: {
    initInvalidDate() {
      for (let index = 0; index < 182; index++) {
        const date = new Date().addDays(index);

        const weekNumber = getWeekNumber(date) - 1;
        
        if(!(weekNumber % 2)) {
          this.invalidDates.push(date);
        }
      }
    },
    ...mapActions('formation', ['getDurationRules', 'getStoreList'])
  },
  computed: {
    ...mapState('person', ['job', 'xp']),
    ...mapState('formation', ['durationRules', 'storeList'])
  },
  watch: {
    formationType(value) {
      this.filteredRules = this.startingRules.filter(rule => 
        rule.fields['Type de formation'] === value
      );
      if(this.filteredRules.length > 1) {
        // Affichage uniquement des jobs possible restant
        this.jobs = this.filteredRules.map(rule => rule.fields['Poste visé']);
        this.targetJob = '';
      } else if(this.filteredRules.length > 0) {
        this.duration = this.filteredRules[0].fields['Durée en semaine'];
      }
    },
    targetJob(value) {
      // Se trigger que sur un mercato => On met juste la durée à jour direct
      if(value !== '') {
        const chosenRule = this.filteredRules.find(rule => 
          rule.fields['Poste visé'] === value
        );

        this.duration = chosenRule.fields['Durée en semaine'];
      }
    },
  },
  async beforeMount() {
    this.initInvalidDate();
    await this.getDurationRules();
    this.startingRules = this.durationRules.filter(rule => 
      rule.fields['Poste actuel'] === this.job && 
      (rule.fields['Ancienneté > 2 ans'] ? rule.fields['Ancienneté > 2 ans'] === this.xp : true)
    );
    const typePossibilities = this.startingRules.map(rule => rule.fields['Type de formation']);
    this.formationTypes = typePossibilities.filter((type, index, self) => self.indexOf(type) === index);

    if(this.formationTypes.length === 1) {
      this.formationType = this.formationTypes[0];
    }
    await this.getStoreList();
    this.formatedStoreList = this.storeList.map(store => (
      { label: store.fields["Nom du magasin"], value: store.id }
    ));
  }
}
</script>

<style scoped>
.only-type {
  margin-bottom: 25px;
  margin-top: -25px;
}
.duration {
  margin-bottom: 40px;
}
</style>