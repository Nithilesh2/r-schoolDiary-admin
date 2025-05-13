import React, { useState } from 'react'
import { AppContext } from './AppContext';

const AppStore = ({children}) => {

  const [isOpen, setIsOpen] = useState(true)

  return (
    <AppContext.Provider value={{
      setIsOpen,
      isOpen
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppStore
