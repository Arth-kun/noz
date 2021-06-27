import Airtable from 'airtable';

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.VUE_APP_AIRTABLE_API_KEY
});
const base = Airtable.base('appBja9jzHIz1c7VE');

export default {
  namespaced: true,
  state: {
    status: 'notsent',
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
    SAVE_PERSON_ID(state, payload) {
      return state.recordId = payload.recordId;
    },
    SAVE_JOB(state, payload) {
      return state.job = payload.job;
    },
    SAVE_XP(state, payload) {
      return state.xp = payload.xp;
    },
  },
  actions: {
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
            "Zone": payload.zone,
          }
        }
      ], (err, records) => {

        if (err) {
          console.error(err);
          context.commit('CHANGE_STATUS', { status: 'error' });
          return;
        }

        const [record] = records;
        context.commit('CHANGE_STATUS', { status: 'success' });
        context.commit('SAVE_PERSON_ID', { recordId: record.id });
        context.commit('SAVE_JOB', { job: payload.job });
        context.commit('SAVE_XP', { xp: payload.xp });
      });
    },
    resetState(context) {
      context.commit('SAVE_PERSON_ID', { recordId: null });
      context.commit('SAVE_JOB', { job: '' });
      context.commit('SAVE_XP', { xp: '' });
    }
  },
}
