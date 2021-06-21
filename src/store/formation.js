import Airtable from 'airtable';

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.VUE_APP_AIRTABLE_API_KEY
});
const base = Airtable.base('appBja9jzHIz1c7VE');

export default {
  namespaced: true,
  state: {
    durationRules: [],
    storeList: [],
  },
  mutations: {
    SET_DURATION_RULES(state, payload) {
      return state.durationRules = payload.durationRules;
    },
    SET_STORE_LIST(state, payload) {
      return state.storeList = payload.storeList;
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
          return; 
        }
      });
    },
  },
}
