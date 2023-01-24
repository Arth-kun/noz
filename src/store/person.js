import Airtable from 'airtable';

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.VUE_APP_AIRTABLE_API_KEY
});
const base = Airtable.base('appBja9jzHIz1c7VE');

export default {
  namespaced: true,
  state: {
    allStoreList: [],
    zones: [],
    status: 'notsent',
    error: '',
    recordId: null,
    lastname: '',
    firstname: '',
    zone: '',
    xp: '',
    contract: '',
    society: '',
    job: '',
  },
  mutations: {
    CHANGE_STATUS(state, payload) {
      return state.status = payload.status;
    },
    SET_ERROR_MESSAGE(state, payload) {
      return state.error = payload.error;
    },
    SAVE_PERSON_ID(state, payload) {
      return state.recordId = payload.recordId;
    },
    SAVE_JOB(state, payload) {
      return state.job = payload.job;
    },
    SAVE_XP(state, payload) {
      return state.xp = payload.xp;
    },
    SAVE_ZONE(state, payload) {
      return state.zone = payload.zone;
    },
    SET_STORE_LIST(state, payload) {
      return state.allStoreList = [...state.allStoreList, ...payload.allStoreList];
    },
    RESET_STORE_LIST(state) {
      return state.allStoreList = [];
    },
    SET_ZONE_LIST(state, payload) {
      return state.zones = payload.zones;
    },
  },
  actions: {
    getZones(context) {
      base('Zones').select({
        view: "Grid view"
      }).eachPage((records) => {

        const formatRecords = records.map(record => ({ value: record.id, label: record.fields["Nom de la zone"]}));

        context.commit('SET_ZONE_LIST', { zones: formatRecords });        

      }, (err) => {
        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return; 
        }
      });
    },
    getAllStore(context) {
      // First reset just in case
      context.commit('RESET_STORE_LIST');

      base('Magasins parrains').select({
        maxRecords: 2000,
        view: "Tous les magasins"
      }).eachPage((records, fetchNextPage) => {

        const formatRecords = records.map(record => record.fields["Nom du magasin"]);

        context.commit('SET_STORE_LIST', { allStoreList: formatRecords });

        fetchNextPage();
      }, (err) => {
        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          context.commit('SET_ERROR_MESSAGE', { error: err });
          return; 
        }
      });
    },
    createPerson(context, payload) {
      context.commit('CHANGE_STATUS', { status: 'sending' });
      
      base('Collaborateurs').create([
        {
          fields: {
            "Nom": payload.lastname,
            "Prénom": payload.firstname,
            "Experience chez Noz > 2 ans": payload.xp,
            "Type de contrat actuel": payload.contract,
            "Société d'appartenance": payload.society,
            "Fonction actuelle": payload.job,
            "Zone": [payload.zone],
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
        context.commit('CHANGE_STATUS', { status: 'success' });
        context.commit('SAVE_PERSON_ID', { recordId: record.id });
        context.commit('SAVE_JOB', { job: payload.job });
        context.commit('SAVE_XP', { xp: payload.xp });
        context.commit('SAVE_ZONE', { zone: payload.zone });
      });
    },
    resetState(context) {
      context.commit('SAVE_PERSON_ID', { recordId: null });
      context.commit('SAVE_JOB', { job: '' });
      context.commit('SAVE_XP', { xp: '' });
      context.commit('SAVE_ZONE', { zone: '' });
    }
  },
}
