import React from 'react'
import Sidebar from "../../components/Sidebar"
import styles from "./styles/AddSchool.module.css"

const AddSchool = () => {
  return (
    <div>
      <div className={styles.main}>
        <Sidebar />
        <div className={styles.right}>add schools</div>
      </div>
    </div>
  )
}

export default AddSchool
