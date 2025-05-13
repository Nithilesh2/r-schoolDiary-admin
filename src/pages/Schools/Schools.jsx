import React from "react"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/Schools.module.css"

const Schools = () => {
  return (
    <div>
      <div className={styles.main}>
        <Sidebar />
        <div className={styles.right}>schools</div>
      </div>
    </div>
  )
}

export default Schools
