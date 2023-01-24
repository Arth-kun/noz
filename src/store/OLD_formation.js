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
        
        const formatRecords = records.map(record => (record.fields["Date"]));
        context.commit('SET_FORMATION_DATES', { formationDates: formatRecords });        

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
      const { endDate, beginDate, isFormationInTwoPart } = payload;

      if (isFormationInTwoPart) {
        const { duration, secondDuration } = payload;
        let amountOfDays = duration * 7;

        if(duration % 2) {
          // Si la durée en semaine est impaire => on fini un samedi
          amountOfDays -= 3;
        } else {
          amountOfDays -= 4;
        }

        const firstBeginDate = beginDate;
        const firstEndDate = firstBeginDate.addDays(amountOfDays);

        let amountOfDaysTwo = secondDuration * 7;
        const totalDuration = duration + secondDuration + 1;

        if(!(totalDuration % 2) && !(secondDuration % 2)) {
          // even and even
          amountOfDaysTwo -= 4;
        } else if(totalDuration % 2 && secondDuration % 2) {
          // odd and odd
          amountOfDaysTwo -= 2;
        } else {
          // odd and even or even and odd
          amountOfDaysTwo -= 3;
        }

        const secondEndDate = endDate;
        const secondBeginDate = secondEndDate.addDays(-amountOfDaysTwo);

        context.dispatch('createFormation', { ...payload, beginDate: firstBeginDate, endDate: firstEndDate });
        context.dispatch('createFormation', { ...payload, beginDate: secondBeginDate, endDate: secondEndDate, duration: secondDuration });


      } else {
        context.dispatch('createFormation', payload);
      }
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
          } else if ((index + 1) % 2) {
            // Si c'est impaire
            const lastWeekEndDate = weeks[index - 1].weekEndDate;
            weekBeginDate = new Date(lastWeekEndDate).addDays(4);
          } else {
            // Si c'est paire
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
          // On créé une condition pour déterminer si c'est la première semaine ou non
          const isFirstStore = (index + 1) <= payload.firstStoreDuration;
          return {
            fields: {
              "Semaine formation": index + 1,
              "Magasin Parrain": [isFirstStore ? payload.firstStore: payload.secondStore],
              "Besoin Hotel": isFirstStore ? payload.firstNeedHotel : payload.secondNeedHotel,
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