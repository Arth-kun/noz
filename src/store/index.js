import { createStore } from 'vuex'

import person from './person'
import formation from './formation'

export default createStore({
  modules: {
    person,
    formation,
  },
})
