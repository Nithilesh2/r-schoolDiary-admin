import React from "react"
import Sidebar from "../components/Sidebar"
import styles from "./Dashboard.module.css"

const Dashboard = () => {
  return (
    <div className={styles.main}>
      <Sidebar />
      <div className={styles.right}>
        <h1>Welcome to the Admin Dashboard</h1>
        <p>Select a section from the menu</p>
      </div>
    </div>
  )
}

export default Dashboard
