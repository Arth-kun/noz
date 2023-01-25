import Airtable from 'airtable';

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.VUE_APP_AIRTABLE_API_KEY
});
const base = Airtable.base('appBja9jzHIz1c7VE');

function formatDate(date) {
  const y = date.getFullYear();
  const m = date.getMonth().toString().length === 1 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  const d = date.getDate().toString().length === 1 ? '0' + date.getDate() : date.getDate();
  
  return `${y}-${m}-${d}`
}

export default {
  namespaced: true,
  state: {
    status: 'notsent',
    error: '',
    durationRules: [],
    startingRules: [],
    formationTypes: [],
    storeList: [],
    formationDates : [],
    formationDatesTakenPlacesCount : []
  },
  mutations: {
    CHANGE_STATUS(state, payload) {
      return state.status = payload.status;
    },
    SET_ERROR_MESSAGE(state, payload) {
      return state.error = payload.error;
    },
    SET_DURATION_RULES(state, payload) {
      return state.durationRules = payload.durationRules;
    },
    SET_STARTING_RULES(state, payload) {
      return state.startingRules = payload.startingRules;
    },
    SET_FORMATION_TYPES(state, payload) {
      return state.formationTypes = payload.formationTypes;
    },
    SET_STORE_LIST(state, payload) {
      return state.storeList = payload.storeList;
    },
    SET_FORMATION_DATES(state, payload) {
      return state.formationDates = payload.formationDates;
    },
    SET_FORMATION_DATES_TAKEN_PLACES_COUNT(state, payload) {
      return state.formationDatesTakenPlacesCount = payload.formationDatesTakenPlacesCount
    }
  },
  actions: {
    getDurationRules(context) {
      base('Règles durée de formation').select({
        view: "Grid view"
      }).eachPage((records) => {

        context.commit('SET_DURATION_RULES', { durationRules: records });        

      }, (err) => {
        if (err) {
          console.error(err);
          return; 
        }
      });
    },
    getStoreList(context) {
      base('Magasins parrains').select({
        view: "Magasins parrains"
      }).eachPage((records) => {

        context.commit('SET_STORE_LIST', { storeList: records });        

      }, (err) => {
        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return; 
        }
      });
    },
    getFormationDates(context) {
      base('Dates formations').select({
        view: "Grid view"
      }).eachPage((records) => {
        
        context.commit('SET_FORMATION_DATES', { formationDates: records });        

      }, (err) => {
        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return; 
        }
      });
    },
    getFormationsByDate(context) {
      base('Formations').select({
        view: "Formation par date de début"
      }).eachPage((records) => {
        let groupedDatas = {}
        records.forEach(element => {
          if(groupedDatas[element.fields['Date début formation en magasin']]) {
            return groupedDatas[element.fields['Date début formation en magasin']] += 1
          } else {
            return groupedDatas[element.fields['Date début formation en magasin']] = 1
          }
        }); 

        context.commit('SET_FORMATION_DATES_TAKEN_PLACES_COUNT', { formationDatesTakenPlacesCount: groupedDatas });        

      }, (err) => {
        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return; 
        }
      });
    },
    setDurationAndFormationTypes(context, payload) {
      if(payload) {
        context.commit('SET_FORMATION_TYPES', payload);
        context.commit('SET_STARTING_RULES', payload);
      }
    },
    dispatchFormation(context, payload) {
      context.dispatch('createFormation', { ...payload, beginDate: payload.firstBeginDate, endDate: payload.firstEndDate, duration: 2, firstPart: true });
      context.dispatch('createFormation', { ...payload, beginDate: payload.secondBeginDate, endDate: payload.secondEndDate, duration: 2, firstPart: false });
    },
    createFormation(context, payload) {
      context.commit('CHANGE_STATUS', { status: 'sending' });

      const { endDate, beginDate } = payload;

      const begin = formatDate(beginDate);
      const end = formatDate(endDate);


      base('Formations').create([
        {
          fields: {
            "Type de formation": payload.formationType,
            "Fonction visée": payload.targetJob.length > 0 ? payload.targetJob : payload.job,
            "Nom": [payload.recordId],
            "Durée de formation (semaines)": payload.duration,
            "Date début formation en magasin": begin,
            "Date fin formation": end,
            "Statut Orizon Formation": 'Validé',
          }
        }
      ], (err, records) => {

        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return;
        }

        const [record] = records;
        console.log('RECORD CRÉE', record);
        
        //Then trigger another action that will create all the weeks in the right table
        let weeks = new Array(payload.duration);

        // Calculate the weekBeginDate and weekEndDate for each week
        // no matter if there is one or two store
        for (let index = 0; index < weeks.length; index++) {
          let weekBeginDate;
          let weekEndDate;

          if(index === 0) {
            weekBeginDate = beginDate;
          } else if (new Date(weeks[index -1].weekBeginDate).getDay() == 1 ) {
            // Si le premier de la semaine précédente est un lundi
            // alors on fait commencer la semaine un mardi
            const lastWeekEndDate = weeks[index - 1].weekEndDate;
            weekBeginDate = new Date(lastWeekEndDate).addDays(4);
          } else if (new Date(weeks[index -1].weekBeginDate).getDay() == 2) {
            // Si le premier de la semaine précédente est un mardi
            // alors on fait commencer la semaine un lundi
            const lastWeekEndDate = weeks[index - 1].weekEndDate;
            weekBeginDate = new Date(lastWeekEndDate).addDays(2);
          }

          // We always add 4 days to the begin days to have the end day
          weekEndDate = weekBeginDate.addDays(4);

          // Reformat in string :
          weekBeginDate = formatDate(weekBeginDate);
          weekEndDate = formatDate(weekEndDate);

          weeks[index] = {
            weekBeginDate,
            weekEndDate
          };
        }

        console.log('weeks', weeks);


        weeks = weeks.map((week, index) => {
          // On crée une condition pour déterminer si c'est la première semaine ou non
          return {
            fields: {
              "Semaine formation": payload.firstPart ? index + 1 : index + 1 + 2,
              "Magasin Parrain": [payload.firstPart || payload.sameStore ? payload.firstStore : payload.secondStore],
              "Besoin Hotel": payload.firstPart || payload.sameStore ? payload.firstNeedHotel : payload.secondNeedHotel,
              "Id Formation": [record.id],
              "Date de début semaine": week.weekBeginDate,
              "Date de fin semaine": week.weekEndDate
            }
          }
        });
        

        // IL FAUT GERER LE CAS DES DEUX MAGASINS !!!

        console.log('weeks', weeks);

        base('Formation/Magasin/Hotel').create(weeks, (err, records) => {

          if (err) {
            console.error(err);
            context.commit('CHANGE_STATUS', { status: 'error' });
            context.commit('SET_ERROR_MESSAGE', { error: err });
            return;
          }

          context.commit('CHANGE_STATUS', { status: 'success' });

          console.log('RECORDs CRÉEs', records);

        });
      });
    },
    resetStatus(context) {
      context.commit('CHANGE_STATUS', { status: 'notsent' });
    }
  },
}
