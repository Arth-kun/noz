<template>
  <Header />
  <div class="layout" v-if="status !== 'success'">
    <div class="col">
      <!-- Choix de la formation -->
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
      <!-- Poste visé si Mercato-->
      <span class="p-float-label" v-if="formationType === 'Mercato'">
        <Dropdown 
          id="targetJob" 
          v-model="targetJob" 
          :options="jobs"
        />
        <label for="targetJob">Poste visé</label>
      </span>
      <!-- Info : durée de la formation -->
      <div class="duration">
        {{ `Temps passé en magasin parrain : ${duration === 0 ? '?' : duration} semaines`}}
      </div>
      <!-- Calendrier de la date de début -->
      <span class="p-float-label">
        <Calendar 
          id="firstBeginDate" 
          v-on:show="calendarShow"
          v-on:month-change="calendarMonthChange"
          v-model="globalBeginDate" 
          :disabledDates="invalidDates"
          :disabledDays="invalidDays"
          :minDate="new Date()"
          :disabled="duration === 0"
          dateFormat="dd/mm/yy"
        >
          <template #footer>
            <p style="margin-left: 10px;" v-if="placeCount > 0">Il reste {{ placeCount }} place(s) libre(s) ce mois-ci.</p>
            <p style="margin-left: 10px;" v-else>Il ne reste aucune place libre ce mois-ci.</p>
          </template>
        </Calendar>
        <label for="firstBeginDate">Date de début</label>
      </span>
      <!-- Carte du premier magasin -->
      <div class="first-store card" v-if="globalBeginDate !== '' && duration !== 0">
        <span class="store-title">
          {{`Choix du ${!sameStore ? 'premier' : ''} magasin parrain :`}}
        </span>
        <!-- Affichage de la durée -->
        <div class="weeks-container">
          <span v-if="sameStore">{{ `2 semaines du ${firstBeginDate.toLocaleDateString()} au ${firstEndDate.toLocaleDateString()} et 2 semaines du ${secondBeginDate.toLocaleDateString()} au ${secondEndDate.toLocaleDateString()}` }}</span>
          <span v-else>{{ `2 semaines du ${firstBeginDate.toLocaleDateString()} au ${firstEndDate.toLocaleDateString()}` }}</span>
        </div>
        <!-- Choix du magasin parrain -->
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
        <!-- Checkbox du besoin d'hôtel -->
        <span class="p-float-label">
          <Dropdown 
            id="firstNeedHotel" 
            v-model="firstNeedHotel" 
            :options="yesNoOptions"
          />
          <label for="firstNeedHotel">Besoin d'un hôtel ?</label>
        </span>
      </div>
      <!-- Checkbox : Si la formation est dans le même magasin ou non -->
      <div class="field-checkbox same-checkbox" v-if="firstBeginDate !== '' && duration !== 0">
        <Checkbox v-model="sameStore" :binary="true" inputId="sameStore" />
        <label for="sameStore">Je souhaite faire les deux périodes dans le même magasin</label>
      </div>
      <!-- Carte du second magasin -->
      <div class="second-store card" v-if="secondStoreDuration > 0">
        <span class="store-title">
          Choix du deuxième magasin parrain :
        </span>
        <div class="weeks-container">
          <span>{{ `2 semaines du ${secondBeginDate.toLocaleDateString()} au ${secondEndDate.toLocaleDateString()}` }}</span>
        </div>
        <span class="p-float-label">
          <Dropdown 
            id="secondStore" 
            v-model="secondStore" 
            :options="storeOptions.second"
            optionLabel="label"
            optionValue="value"
          />
          <label for="secondStore">Magasin parrain</label>
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
            firstBeginDate,
            firstEndDate,
            secondBeginDate,
            secondEndDate,
            sameStore,
            firstStore, 
            secondStore,
            firstNeedHotel,
            secondNeedHotel,
            firstStoreDuration,
            secondStoreDuration,
            duration
          })"
        >
          <span style="font-weight: bold;">Envoyer</span>
          <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem" v-if="status === 'sending'"></i>
        </Button>
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
      class="p-button-rounded p-button-lg"
      @click="returnHome"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Header from '../components/Header.vue';
import { getAmountOfDays } from '../utils.js';

export default {
  name: 'CreateFormation',
  components: {
    Header
  },
  data() {
    return {
      jobs: [],
      yesNoOptions : ['Oui', 'Non'],
      sameStore: true,
      gapWeek: 2,

      formationType: '',
      targetJob: '',
      globalBeginDate: '',
      firstBeginDate: '',
      firstEndDate: '',
      secondBeginDate: '',
      secondEndDate: '',
      firstStore: '',
      secondStore: '',
      firstNeedHotel:'',
      secondNeedHotel:'',
      firstStoreDuration: 4,
      secondStoreDuration: 0,
      
      invalidDates: [new Date()],
      invalidDays: [0, 1, 3, 4, 5, 6],
      filteredRules: [],
      storeOptions: { first: [], second: []},
      duration: 4,
      placeCount: 0,
    }
  },
  methods: {
    getPlaceCount(date) {
      // We get back the formation line corresponding to with calendar chosen month/year
      let dates = this.formationDates.filter(element => {
        if(element.fields['Date'] && element.fields['Nombre de stagiaire max'] && element.fields['Date'].indexOf(date) > -1) {
          return true;
        }
      });
      // If there is at least one result
      if(dates.length > 0){
        // We get back the alreday taken places count
        const takenPlacesCount = this.formationDatesTakenPlacesCount[dates[0].fields['Date']]
        // if some places are already taken, we put in this.placeCount maximum capacity minus taken count
        // else maximum capacity
        this.placeCount = takenPlacesCount ? parseInt(dates[0].fields['Nombre de stagiaire max']) - takenPlacesCount : dates[0].fields['Nombre de stagiaire max']
      } else {
        // if there is no date result or several, we put in this.placeCount zero value
        this.placeCount = 0
      }
    },
    calendarShow() {
      let today = new Date()
      this.getPlaceCount(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`)
    },
    calendarMonthChange(event) {
      this.getPlaceCount(`${event.year}-${event.month.toString().padStart(2, '0')}`)
    },
    initInvalidDate() {
      // v2 for the update of 2023 jan
      // Need to check on each day, is it a day that is in the database, 
      // if not add it to the list of invalidDates
      this.invalidDates = [new Date()];
      for (let index = 0; index < 1820; index++) {
        const date = new Date().addDays(index);
        const condition = this.formationDates.find(formationDateObject => (
          new Date(formationDateObject.fields["Date"]).toDateString() === date.toDateString()
        ));
        if(condition === undefined) {
          // Chez moi, si je mets la fonction addDays(1), les dates qui sortent sont les 15 et 26,
          // c'es-à-dire un jour de plus que les dates de la BDD,
          // donc je pense effectivement que c'est un problème de time zone...
          // Je laisse les 2 lignes pour que l'on puisse tester tous les deux à tour de rôle :)
          //this.invalidDates.push(date.addDays(1));
          this.invalidDates.push(date);
        }
      }
      // Invalid dates for which formation capacity is reached
      // For all formation dates
      this.formationDates.forEach(element => {
        // Get back already taken places count with the date
        const takenPlacesCount = this.formationDatesTakenPlacesCount[element.fields['Date']]
        // Invalid date if max capacity is smaller or equal to taken places count or if max capacity is null
        if((takenPlacesCount && element.fields['Nombre de stagiaire max'] <= takenPlacesCount) || element.fields['Nombre de stagiaire max'] == 0) {
          this.invalidDates.push(new Date(element.fields['Date']));
        }
      });
    },
    filterStore(storeIndex, twoStores) {
      const chosenCities = []
      this.storeOptions[storeIndex] = this.storeList.filter(store => {
        // Check pour chaque début et fin d'absence ou de formation prévu si les dates sont dans l'interval ou non
        // => Mettre dans une fonction
        let isOut = false;
        // Check indispo
        if(store.fields['Date début indispo'] && store.fields['Date fin indispo']) {
          // Check début indispo
          if(!twoStores){
            // S'il n'y a qu'un magasin
            const isOutFirst = this.checkDatesMatches(store.fields['Date début indispo'], this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
            const isOutSecond = this.checkDatesMatches(store.fields['Date début indispo'], this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
            // On évince un magasin si la jauge est atteinte à l'une ou l'autre date
            isOut = isOutFirst || isOutSecond
          } else {
            // Si il y a deux magasins
            if(storeIndex == 'first'){
              isOut = this.checkDatesMatches(store.fields['Date début indispo'], this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
            } else {
              isOut = this.checkDatesMatches(store.fields['Date début indispo'], this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
            }
          }
          // Check fin indispo si pas déjà out
          if(!isOut) {
            if(!twoStores){
              // S'il n'y a qu'un magasin
              const isOutFirst = this.checkDatesMatches(store.fields['Date fin indispo'], this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              const isOutSecond = this.checkDatesMatches(store.fields['Date fin indispo'], this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              // On évince un magasin si la jauge est atteinte à l'une ou l'autre date
              isOut = isOutFirst || isOutSecond
            } else {
              // Si il y a deux magasins, on évince les magasins suivant le dropdown à alimenter
              if(storeIndex == 'first') {
                isOut = this.checkDatesMatches(store.fields['Date fin indispo'], this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              } else {
                isOut = this.checkDatesMatches(store.fields['Date fin indispo'], this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              }
            }
          }
        }
        
        // ---------------------

        // Check formation
        if(store.fields['Date début semaines'] && store.fields['Date fin semaines'] && !isOut) {
          // Check début semaines forma si pas déjà out
          if(!isOut) {
            const beginWeekDates = this.filterDateCanceled(store.fields["Status semaine formation"], store.fields['Date début semaines']);
            if(!twoStores){
              // S'il n'y a qu'un magasin
              const isOutFirst = this.checkDatesMatches(beginWeekDates, this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              const isOutSecond = this.checkDatesMatches(beginWeekDates, this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              // On évince un magasin si la jauge est atteinte à l'une ou l'autre date
              isOut = isOutFirst || isOutSecond
            } else {
              // Si il y a deux magasins
              if(storeIndex == 'first'){
                isOut = this.checkDatesMatches(beginWeekDates, this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              } else {
                isOut = this.checkDatesMatches(beginWeekDates, this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              }
            }
          }
          // Check fin semaines forma si pas déjà out
          if(!isOut) {
            const endWeekDates = this.filterDateCanceled(store.fields["Status semaine formation"], store.fields['Date fin semaines']);
            if(!twoStores){
              // S'il n'y a qu'un magasin
              const isOutFirst = this.checkDatesMatches(endWeekDates, this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              const isOutSecond = this.checkDatesMatches(endWeekDates, this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              // On évince un magasin si la jauge est atteinte à l'une ou l'autre date
              isOut = isOutFirst || isOutSecond
            } else {
              // Si il y a deux magasins, on évince les magasins suivant le dropdown à alimenter
              if(storeIndex == 'first') {
                isOut = this.checkDatesMatches(endWeekDates, this.firstBeginDate, this.firstEndDate, store.fields['Jauge stagiaire']);
              } else {
                isOut = this.checkDatesMatches(endWeekDates, this.secondBeginDate, this.secondEndDate, store.fields['Jauge stagiaire']);
              }
            }
          }
        }

        return !isOut;

      }).map(filteredStore => 
        {
          const itemZone = this.zones.find(zone => { return zone.value === filteredStore.fields["Zone"][0] })
          return { 
            value: filteredStore.id,
            zone: itemZone,
            label: `${filteredStore.fields["Nom du magasin"]} 
            (prio : ${filteredStore.fields["Ordre de priorité"] ?? 'non défini' }) 
            (zone : ${itemZone.label})`,
            priority: filteredStore.fields["Ordre de priorité"]
          }
        }
      ).sort((a, b) =>
        {
          const aZone = a.zone.label;
          const bZone = b.zone.label;
          const aPrio = a.priority ?? 9999;
          const bPrio = b.priority ?? 9999;
          return aZone.localeCompare(bZone) || aPrio - bPrio;
        }
      ).filter(store => {
        if(store.zone.value == this.zone){
          chosenCities.push(store);
          return false;
        } else {
          return true;
        }
      });

      // Put chosen zone's cities on top of the list
      chosenCities.forEach((element, index) => {
        this.storeOptions[storeIndex].splice(index, 0, element)
      })

      // Populate the dropdowns with a default value
      if(this.storeOptions["first"].length > 0 && storeIndex == "first"){
        this.firstStore = this.storeOptions["first"][0]['value']
      }
      if(storeIndex == "second"){
        if(this.storeOptions["second"].length > 0 && this.storeOptions["second"][0]['value'] !== this.storeOptions["first"][0]['value']){
          this.secondStore = this.storeOptions["second"][0]['value']
        }
        else if(this.storeOptions["second"].length > 1){
          this.secondStore = this.storeOptions["second"][1]['value']  
        }
      }
    },
    filterDateCanceled(status, dates) {
      // Return dates that doesn't have a "Désistement" status
      if(status) {
        const filteredDates = dates.filter((_, i) => status[i] !== "Désistement");

        return filteredDates;
      }
      return dates;
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
        this.firstBeginDate !== '' &&
        this.firstStore.length > 0 &&
        this.firstNeedHotel.length > 0 &&
        (this.firstStoreDuration !== this.duration ?
          this.secondStore.length > 0 && this.secondNeedHotel.length > 0 :
          true
        )
      );
    },
    ...mapState('person', ['job', 'xp', 'recordId', 'zone', 'zones']),
    ...mapState('formation', ['storeList', 'formationDates', 'nbSemaineformationPrestataire', 'formationTypes', 'startingRules', 'status', 'error', 'formationDatesTakenPlacesCount'])
  },
  watch: {
    sameStore(value) {
      if(value) {
        this.firstStoreDuration = 4
      } else {
        this.firstStoreDuration = 2
      }
    },
    formationType(value) {
      this.filteredRules = this.startingRules.filter(rule => 
        rule.fields['Type de formation'] === value
      );
      console.log(this.filteredRules);
      if(this.filteredRules.length > 0) {
        // Affichage uniquement des jobs possible restant
        this.jobs = this.filteredRules.map(rule => rule.fields['Poste visé']);
        this.targetJob = '';
      } 
      
      if(this.filteredRules.length === 1) {
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

        // Récupération de la règle des mardis (paire, impaire ou les deux)
        // + Relance de l'init des jours
        const tuesdayRule = chosenRule.fields['Mardi début de formation'];
        this.initInvalidDate(tuesdayRule);
      }
    },
    globalBeginDate(value) {
      // Ajout de la global begin date, qui ne doit pas être la même que la first begin Date
      // Potentiellement passer le watch sur la global, puis calcul de la first begin date en plus
      this.firstBeginDate = value.addDays(this.nbSemaineformationPrestataire * 7 + 1);

      // Calcul de la date de fin en comptant la pause
      const globalDuration = this.duration + this.gapWeek;
      let globalAmountOfDays = getAmountOfDays(globalDuration);

      this.secondEndDate = this.firstBeginDate.addDays(globalAmountOfDays);

      // Calcul des 2 paires de dates de début et fin
      // La formation est tjs de 2 * 2 semaines
      const duration = 2;
      const secondDuration = 2;

      this.firstEndDate = this.firstBeginDate.addDays(getAmountOfDays(duration));

      let amountOfDaysTwo = secondDuration * 7;

      // Le paire ou impaire dépend uniquement du nombre de semaines séparant les 2 parties de la formation
      if(this.gapWeek % 2) {
        amountOfDaysTwo -= 2
      } else {
        amountOfDaysTwo -= 4
      }

      this.secondBeginDate = this.secondEndDate.addDays(-amountOfDaysTwo);

      // Refiltrer les magasins et afficher uniquement les magasins qui correspondent
      this.filterStore("first", !this.sameStore);
      this.filterStore("second", !this.sameStore);
    },
    duration(value) {
      this.firstStoreDuration = value;
    },
    firstStoreDuration(value, pastValue) {
      this.secondStoreDuration = this.duration - value;
      // Si on n'a plus de semaines sur le premier magasin => On doit recheck si ce magasin est bien dispo, same pour le deuxième
      if(pastValue > value) {
        this.secondStore = '';
      } else {
        this.firstStore = '';
      }

      if(this.firstBeginDate) {
        this.filterStore("first", !this.sameStore);
        this.filterStore("second", !this.sameStore);
      }
    },
  },
  beforeMount() {
    this.initInvalidDate();

    console.log('RECORD ID', this.recordId);
    console.log('RECORD job', this.job);
    if(this.recordId === null) this.$router.push({name:'PersonChoice'});

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
  margin-bottom: 30px;
  font-weight: bold;
}
.store-title {
  display: block;
  margin-bottom: 20px;
}
.card {
  padding: 10px;
  border-color: lightgray;
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  margin-bottom: 30px;
}
.field-checkbox > label {
  line-height: 1;
  margin-left: .5rem;
}
.same-checkbox {
  margin-bottom: 30px;
}
.weeks-container {
  margin-bottom: 20px;
  padding-bottom: 20px;
  font-style: italic;
}
</style>