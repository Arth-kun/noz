<template>
  <Header />
  <div class="layout" v-if="recordId === null">
    <span class="p-float-label">
      <InputText id="lastname" type="text" v-model.trim="lastname" />
      <label for="lastname">Nom</label>
    </span>
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
      <Dropdown id="society" v-model="society" :options="allStoreList" />
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
        @click="createPerson({ firstname, lastname, zone, society, job, xp, contract })"
      />
      <i class="pi pi-spin pi-spinner" style="fontSize: 2rem" v-if="status === 'sending'"></i>
    </div>
    <Message v-if="status === 'error'" severity='error' :closable="false">
      Une erreur est survenue, merci de de remonter ce problème s'il persiste.
    </Message>
  </div>

  <div class="layout" v-else>
    <Message severity='info' :closable="false">
      Vous avez déjà créé un collaborateur, vous devez à présent compléter les informations sur sa formation à venir.
      Si vous souhaitez recommencer de zéro, merci de réactualiser la page (Ctrl + R).
    </Message>
    <Button 
      label="Suivant" 
      @click="$router.push({name: 'CreateFormation' })"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import Header from '../components/Header.vue';
import zones from '../datasets/zones.json';
import jobs from '../datasets/jobs.json';
import contracts from '../datasets/contracts.json';
export default {
  name: 'PersonChoice',
  components: {
    Header
  },
  data() {
    return {
      zones: zones,
      xps: [
        'Oui',
        'Non'
      ],
      contracts: contracts,
      societies: [
        'Laval 2',
      ],
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
    ...mapActions('person', ['createPerson', 'getAllStore']),
    ...mapActions('formation', ['setDurationAndFormationTypes', 'getStoreList', 'getDurationRules']),
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
    fullName() {
      return this.firstname + ' ' + this.lastname;
    },
    ...mapState('person', ['status', 'recordId', 'allStoreList']),
    ...mapState('formation', ['durationRules', 'storeList'])
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
    }
  },
  async beforeMount() {
    await this.getAllStore();
    await this.getStoreList();
    await this.getDurationRules();
  }
}
</script>

<style>
  .layout {
    width: 100%;
    min-height: 40%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    padding: 100px 0;
  }

  .p-float-label {
    margin-bottom: 30px;
    min-width: 20%;
  }

  .p-dropdown.p-component.p-inputwrapper {
    min-width: 100%;
  }

  .pi-spinner {
    margin-left: 20px;
  }

  .p-message-info {
    max-width: 50%;
  }

</style>
