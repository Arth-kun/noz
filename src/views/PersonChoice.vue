<template>
  <Header />
  <div class="layout" v-if="recordId === null">
    <div class="col">
      <span class="p-float-label">
        <InputText id="lastname" type="text" v-model.trim="lastname" />
        <label for="lastname">Nom</label>
      </span>
      <span class="p-float-label">
        <InputText id="firstname" type="text" v-model.trim="firstname" />
        <label for="firstname">Prénom</label>
      </span>
      <span class="p-float-label">
        <Dropdown 
          id="zone" 
          v-model="zone" 
          :options="zones"
          optionLabel="label"
          optionValue="value"
        />
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
      <div class="centered">
        <Button
          label="Suivant" 
          class="p-button-rounded p-button-lg"
          :disabled="!canSavePerson" 
          @click="createPerson({ firstname, lastname, zone, society, job, xp, contract })"
        >
          <span style="font-weight: bold;">Suivant</span>
          <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem" v-if="status === 'sending'"></i>
        </Button>
      </div>
      <Message v-if="status === 'error'" severity='error' :closable="false">
        Une erreur est survenue, merci de de remonter ce problème s'il persiste :
        {{ error.message }} Code : {{error.statusCode}} / {{error.error}}
      </Message>
    </div>
  </div>

  <div class="layout" v-else>
    <Message severity='info' :closable="false">
      Vous avez déjà créé un collaborateur, vous devez à présent compléter les informations sur sa formation à venir.
      Si vous souhaitez recommencer de zéro, merci de réactualiser la page (Ctrl + R).
    </Message>
    <Button 
      label="Suivant"
      class="p-button-rounded p-button-lg"
      @click="$router.push({name: 'CreateFormation' })"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import Header from '../components/Header.vue';
import jobs from '../datasets/jobs.json';
import contracts from '../datasets/contracts.json';
export default {
  name: 'PersonChoice',
  components: {
    Header
  },
  data() {
    return {
      xps: [
        'Oui',
        'Non'
      ],
      contracts: contracts,
      jobs: jobs,
      lastname: '',
      firstname: '',
      zone: '',
      xp: '',
      contract: '',
      society: '',
      job: '',
    }
  },
  methods: {
    ...mapActions('person', ['createPerson', 'getAllStore', 'getZones']),
    ...mapActions('formation', ['setDurationAndFormationTypes', 'getStoreList', 'getFormationDates', 'getDurationRules', 'getFormationsByDate']),
  },
  computed: {
    canSavePerson() {
      return (
        this.lastname.length > 0 && 
        this.firstname.length > 0 &&
        this.zone.length > 0 &&
        this.xp.length > 0 &&
        this.contract.length > 0 &&
        this.society.length > 0 &&
        this.job.length > 0
      );
    },
    societies() {
      return [...this.allStoreList, ...this.zones.map(zone => zone.label)]
    },
    ...mapState('person', ['status', 'recordId', 'allStoreList', 'zones', 'error']),
    ...mapState('formation', ['durationRules', 'storeList', 'formationDates'])
  },
  watch: {
    status(value) {
      if(value === 'success') {
        // Set duration rules for the next screen
        const startingRules = this.durationRules.filter(rule => 
          rule.fields['Poste actuel'] === this.job && 
          (rule.fields['Ancienneté > 2 ans'] ? rule.fields['Ancienneté > 2 ans'] === this.xp : true)
        );
        const typePossibilities = startingRules.map(rule => rule.fields['Type de formation']);
        const formationTypes = typePossibilities.filter((type, index, self) => self.indexOf(type) === index);

        // Update vuex for the "CreateFormation" view
        this.setDurationAndFormationTypes({ formationTypes, startingRules });

        this.$router.push({ name: 'CreateFormation' });
      }
    },    
  },
  async beforeMount() {
    await this.getAllStore();
    await this.getZones();
    await this.getStoreList();
    await this.getFormationDates();
    await this.getDurationRules();
    await this.getFormationsByDate();
  },
}
</script>
