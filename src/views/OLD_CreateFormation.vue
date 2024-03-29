<template>
  <Header />
  <div class="layout" v-if="status !== 'success'">
    <div class="col">
      <div class="formation-type-container">
        <span class="p-float-label no-margin-bottom">
          <Dropdown 
            id="formationType" 
            v-model="formationType" 
            :options="formationTypes"
          />
          <label for="formationType">Type de formation</label>
        </span>
        <div class="only-type" v-if="formationTypes.length === 1">
          <i class="pi pi-exclamation-triangle" style="margin-right: 5px;"></i>
          <span>Vous ne pouvez choisir que le type "{{formationType}}"</span>
        </div>
      </div>
      <span class="p-float-label" v-if="formationType === 'Mercato'">
        <Dropdown 
          id="targetJob" 
          v-model="targetJob" 
          :options="jobs"
        />
        <label for="targetJob">Poste visé</label>
      </span>
      <div class="duration">
        {{ `Durée de la formation : ${duration === 0 ? '?' : duration} semaines`}}
      </div>
      <span class="p-float-label">
        <Calendar 
          id="beginDate" 
          v-model="beginDate" 
          :disabledDates="invalidDates"
          :disabledDays="invalidDays"
          :minDate="new Date()"
          :disabled="duration === 0"
          dateFormat="dd/mm/yy"
        />
        <!-- <Calendar 
          id="beginDate" 
          v-model="beginDate" 
          dateFormat="dd/mm/yy"
        /> -->
        <label for="beginDate">Date de début</label>
      </span>
      <div class="first-store card" v-if="beginDate !== '' && duration !== 0">
        <span class="store-title">
          {{`Choix du ${secondStoreDuration > 0 ? 'premier' : ''} magasin parrain :`}}
        </span>
        <div class="p-float-label">
          <InputNumber
            v-model="firstStoreDuration"
            id="firstStoreDuration"
            :max="duration"
            :min="duration < 2 ? duration : 2"
            suffix=" semaines"
            showButtons 
            buttonLayout="horizontal"
            decrementButtonClass="p-button-secondary"
            incrementButtonClass="p-button-secondary"
            incrementButtonIcon="pi pi-plus" 
            decrementButtonIcon="pi pi-minus"
          />
          <label for="firstStoreDuration">Nombre de semaines prévues dans ce magasin {{isFormationInTwoPart ? 'pour la première session' : ''}}</label>
        </div>

        <!-- Si on a la formation en deux fois : -->
        <span class="p-float-label" v-if="isFormationInTwoPart">
          <InputNumber
            v-model="firstStoresecondDuration"
            id="firstStoreDuration"
            :max="secondDuration"
            :min="secondDuration < 2 ? secondDuration : 2"
            suffix=" semaines"
            showButtons 
            buttonLayout="horizontal"
            decrementButtonClass="p-button-secondary"
            incrementButtonClass="p-button-secondary"
            incrementButtonIcon="pi pi-plus" 
            decrementButtonIcon="pi pi-minus"
          />
          <label for="firstStoreDuration">Nombre de semaines prévues dans ce magasin pour la deuxième session</label>
        </span>

        <span class="p-float-label">
          <Dropdown 
            id="firstStore" 
            v-model="firstStore" 
            :options="storeOptions.first"
            optionLabel="label"
            optionValue="value"
          />
          <label for="firstStore">Magasin parrain</label>
        </span>
        <span class="p-float-label">
          <Dropdown 
            id="firstNeedHotel" 
            v-model="firstNeedHotel" 
            :options="yesNoOptions"
          />
          <label for="firstNeedHotel">Besoin d'un hôtel ?</label>
        </span>
      </div>
      <div class="second-store card" v-if="secondStoreDuration > 0">
        <span class="store-title">
          Choix du deuxième magasin parrain :
        </span>
        <span class="p-float-label">
          <InputNumber
            disabled
            v-model="secondStoreDuration"
            id="secondStoreDuration"
            :max="secondStoreDuration"
            :min="secondStoreDuration"
            suffix=" semaines"
          />
          <label for="secondStoreDuration">Nombre de semaines prévues dans ce magasin</label>
        </span>
        <span class="p-float-label">
          <Dropdown 
            id="firstStore" 
            v-model="secondStore" 
            :options="storeOptions.second"
            optionLabel="label"
            optionValue="value"
          />
          <label for="firstStore">Magasin parrain</label>
        </span>
        <span class="p-float-label">
          <Dropdown 
            id="secondNeedHotel" 
            v-model="secondNeedHotel" 
            :options="yesNoOptions"
          />
          <label for="secondNeedHotel">Besoin d'un hôtel ?</label>
        </span>
      </div>
      <div class="centered">
        <Button 
          label="Envoyer"
          class="p-button-rounded p-button-lg"
          :disabled="!canSaveFormation" 
          @click="dispatchFormation({
            recordId,
            job,
            formationType, 
            targetJob, 
            beginDate,
            endDate,
            firstStore, 
            secondStore,
            firstNeedHotel,
            secondNeedHotel,
            firstStoreDuration,
            isFormationInTwoPart,
            firstStoresecondDuration,
            secondStoreDuration,
            duration,
            secondDuration,
          })"
        />
        <i class="pi pi-spin pi-spinner" style="fontSize: 2rem" v-if="status === 'sending'"></i>
      </div>
      <Message v-if="status === 'error'" severity='error' :closable="false">
        Une erreur est survenue, merci de de remonter ce problème s'il persiste :
        {{ error.message }}, code : {{error.statusCode}} / {{error.error}}
      </Message>
    </div>
  </div>

  <div class="layout" v-else>
    <Message severity='success' :closable="false">
      Vous avez créé une demande de formation avec succès !
    </Message>
    <Button 
      label="Faire une nouvelle demande" 
      @click="returnHome"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Header from '../components/Header.vue';

export default {
  name: 'CreateFormation',
  components: {
    Header
  },
  data() {
    return {
      jobs: [],
      yesNoOptions : ['Oui', 'Non'],

      formationType: '',
      targetJob: '',
      beginDate: '',
      endDate: '',
      firstStore: '',
      secondStore: '',
      firstNeedHotel:'',
      secondNeedHotel:'',
      firstStoreDuration: 0,
      firstStoresecondDuration: 0,
      secondStoreDuration: 0,
      
      isFormationInTwoPart: false,
      invalidDates: [new Date()],
      invalidDays: [0, 1, 3, 4, 5, 6],
      filteredRules: [],
      storeOptions: { first: [], second: []},
      duration: 0,
      secondDuration: 0,
    }
  },
  methods: {
    // initInvalidDate(tuesdayRule = 'Impaire') {
    //   this.invalidDates = [new Date()];
    //   if(tuesdayRule === 'Impaire' || tuesdayRule === 'Paire') {
    //     for (let index = 0; index < 1820; index++) {
    //       const date = new Date().addDays(index);

    //       const weekNumber = getWeekNumber(date) - 1;

    //       // If the rule is odd then apply on not modulo of 2, else it's modulo of 2
    //       const condition = tuesdayRule === 'Impaire' ? !(weekNumber % 2) : weekNumber % 2;
          
    //       if(condition) {
    //         this.invalidDates.push(date);
    //       }
    //     }
    //   }
    // },
    initInvalidDate() {
      // v2 for the update of 2023 jan
      // Need to check on each day, is it a day that is in the database, 
      // if not add it to the list of invalidDates
      this.invalidDates = [new Date()];
      for (let index = 0; index < 1820; index++) {
        const date = new Date().addDays(index);
        const condition = this.formationDates.find(formationDate => (
          new Date(formationDate).toDateString() === date.toDateString()
        ));
        if(condition === undefined) {
          this.invalidDates.push(date.addDays(1));
        }
      }
    },
    filterStore(storeIndex, formationBeginDate, formationDuration) {
      //console.log(storeIndex, formationBeginDate, formationDuration);

      this.storeOptions[storeIndex] = this.storeList.filter(store => {
        //console.log(store);

        // Get formation Duration and end Date => Mettre dans une fonction
        let amountOfDays = (formationDuration - 1) * 7;
        if(formationDuration % 2) {
          // Si la durée en semaine est impaire => fini un samedi
          amountOfDays += 4;
        } else {
          // Si la durée en semaine est paire => fini un vendredi
          amountOfDays += 3;
        }

        const formationEndDate = formationBeginDate.addDays(amountOfDays);

        // ---------------------

        // Check pour chaque début et fin d'absence ou de formation prévu si les dates sont dans l'interval ou non
        // => Mettre dans une fonction
        let isOut = false;
        // Check indispo
        if(store.fields['Date début indispo'] && store.fields['Date fin indispo']) {
          // Check début indispo
          isOut = this.checkDatesMatches(store.fields['Date début indispo'], formationBeginDate, formationEndDate);

          // Check fin indispo si pas déjà out
          if(!isOut) {
            isOut = this.checkDatesMatches(store.fields['Date fin indispo'], formationBeginDate, formationEndDate);
          }
        }
        
        // ---------------------

        // Check formation
        if(store.fields['Date début semaines'] && store.fields['Date fin semaines'] && !isOut) {
          // Check début semaines forma si pas déjà out
          if(!isOut) {
            const beginWeekDates = this.filterDateCanceled(store.fields["Status semaine formation"], store.fields['Date début semaines']);
            isOut = this.checkDatesMatches(beginWeekDates, formationBeginDate, formationEndDate, store.fields['Jauge stagiaire']);
          }
          // Check fin semaines forma si pas déjà out
          if(!isOut) {
            const endWeekDates = this.filterDateCanceled(store.fields["Status semaine formation"], store.fields['Date fin semaines']);
            isOut = this.checkDatesMatches(endWeekDates, formationBeginDate, formationEndDate, store.fields['Jauge stagiaire']);
          }
        }

        // ---------------------

        return !isOut;

      }).map(filteredStore => (
        { value: filteredStore.id, label: filteredStore.fields["Nom du magasin"] }
      ));
    },
    filterDateCanceled(status, dates) {
      // Return dates that doesn't have a "Désistement" status
      const filteredDates = dates.filter((_, i) => status[i] !== "Désistement");

      return filteredDates;
    },
    checkDatesMatches(datesArray, beginDate, endDate, maxCapacity = null) {
      // Fonction pour vérifier si une date est dedans pour les dispos magasins
      let cantBeChosen = false;

      datesArray.forEach(date => {
        if(new Date(date).isBetween(beginDate, endDate)) {

          if(!maxCapacity) {
            cantBeChosen = true;
          } else {
            // Check combien il y a de fois la même date de début dans le tableau
            // Si c'est autant que le MaxCapacity => cantBeChosen passe à true
            const duplicates = datesArray.filter(filterDate => filterDate === date);

            if(duplicates.length >= maxCapacity) {
              cantBeChosen = true;
            }
          }

        }
      });

      return cantBeChosen;
    },
    async returnHome() {
      await this.resetState();
      await this.resetStatus();
      this.$router.push({name: 'PersonChoice' });
    },
    ...mapActions('formation', ['dispatchFormation', 'resetStatus']),
    ...mapActions('person', ['resetState']),
  },
  computed: {
    canSaveFormation() {
      return (
        this.formationType.length > 0 &&
        (this.formationType === 'Mercato' ? 
          this.targetJob.length > 0 :
          true
        ) &&
        this.beginDate !== '' &&
        this.firstStore.length > 0 &&
        this.firstNeedHotel.length > 0 &&
        (this.firstStoreDuration !== this.duration ?
          this.secondStore.length > 0 && this.secondNeedHotel.length > 0 :
          true
        )
      );
    },
    ...mapState('person', ['job', 'xp', 'recordId']),
    ...mapState('formation', ['storeList', 'formationDates', 'formationTypes', 'startingRules', 'status', 'error'])
  },
  watch: {
    formationType(value) {
      this.filteredRules = this.startingRules.filter(rule => 
        rule.fields['Type de formation'] === value
      );
      console.log(this.filteredRules);
      if(this.filteredRules.length > 0) {
        // Affichage uniquement des jobs possible restant
        this.jobs = this.filteredRules.map(rule => rule.fields['Poste visé']);
        this.targetJob = '';
        this.duration = 0;
      } 
      
      if(this.filteredRules.length === 1) {
        // Seulement pour integration
        this.duration = this.filteredRules[0].fields['Durée en semaine'];

        // Récupération de la règle des mardis (paire, impaire ou les deux)
        // + Relance de l'init des jours
        const tuesdayRule = this.filteredRules[0].fields['Mardi début de formation'];
        this.initInvalidDate(tuesdayRule);
      }
    },
    targetJob(value) {
      // Se trigger que sur un mercato => On met juste la durée à jour direct
      if(value !== '') {
        const chosenRule = this.filteredRules.find(rule => 
          rule.fields['Poste visé'] === value
        );

        this.duration = chosenRule.fields['Durée en semaine'];

        // Récupération de la règle des mardis (paire, impaire ou les deux)
        // + Relance de l'init des jours
        const tuesdayRule = chosenRule.fields['Mardi début de formation'];
        this.initInvalidDate(tuesdayRule);
      }
    },
    beginDate(value) {
      // Spécificité dans le cas où la formation se fait en deux fois (il n'y a toujours qu'un mag sans ce cas)
      const duration = this.isFormationInTwoPart ? this.firstStoreDuration + this.firstStoresecondDuration + 1 : this.duration;
      let amountOfDays = duration * 7;
      if(duration % 2) {
        // Si la durée en semaine est impaire => on fini un samedi
        amountOfDays -= 3;
      } else {
        amountOfDays -= 4;
      }
      this.endDate = value.addDays(amountOfDays);
      // Refiltrer les magasins et afficher uniquement les magasins qui correspondent
      this.filterStore("first", value, this.isFormationInTwoPart ? this.firstStoreDuration + this.firstStoresecondDuration + 1 : this.firstStoreDuration);
    },
    duration(value) {
      this.firstStoreDuration = value;
    },
    secondDuration(value) {
      this.firstStoresecondDuration = value;
    },
    firstStoreDuration(value, pastValue) {
      this.secondStoreDuration = this.duration - value;
      // Si on a plus de semaine sur le premier magasin => On doit recheck si ce magasin est bien dispo, same pour le deuxième
      if(pastValue > value) {
        this.secondStore = '';
      } else {
        this.firstStore = '';
      }

      if(this.beginDate) {
        const firstDuration = this.isFormationInTwoPart ? value + this.firstStoresecondDuration + 1 : value;
        this.filterStore("first", this.beginDate, firstDuration);
      }
    },
    secondStoreDuration(value) {
      let amountOfDays = this.firstStoreDuration * 7;
      if(this.firstStoreDuration % 2) {
        // Si la durée en semaine est impaire => recommence un lundi au lieu d'un mardi (-1 jour)
        amountOfDays -= 1;
      }

      const secondStoreBeginDate = this.beginDate.addDays(amountOfDays);

      this.filterStore("second", secondStoreBeginDate, value);
    }
  },
  beforeMount() {
    this.initInvalidDate();

    console.log('RECORD ID', this.recordId);
    console.log('RECORD job', this.job);
    if(this.recordId === null) this.$router.push({name:'PersonChoice'});

    if(this.startingRules.length === 1) {
      this.isFormationInTwoPart = this.startingRules[0].fields['Deux périodes séparées en magasins parrains'];
      if(this.isFormationInTwoPart) {
        this.secondDuration = this.startingRules[0].fields['Durée en semaine deuxième période'];
      }
    }

    if(this.formationTypes.length === 1) {
      this.formationType = this.formationTypes[0];
    }
  }
}
</script>

<style scoped>
.formation-type-container{
  margin-bottom: 30px;
}
.only-type {
  margin-top: 15px;
}
.no-margin-bottom {
  margin-bottom: 0 !important;
}
.duration {
  margin-bottom: 40px;
  font-weight: bold;
}
.store-title {
  display: block;
  margin-bottom: 30px;
}
.card {
  padding: 10px;
  border-color: lightgray;
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  margin-bottom: 30px;
}
</style>