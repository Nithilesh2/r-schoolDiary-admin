import { useContext, useEffect, useState } from "react"
import Sidebar from "./../components/Sidebar"
import styles from "./Dashboard.module.css"
import { AppContext } from "../context/AppContext"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { firestore as db } from "../firebase/firebaseConfig"
import { useNavigate } from "react-router-dom"

const ActivitiesPage = () => {
  const { isOpen } = useContext(AppContext)
  const [activities, setActivities] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("time", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setActivities(data)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
        <main className={styles.content}>
          <div className={styles.header}>
            <button onClick={() => navigate("/")} className={styles.backButton}>
              &lt; Back
            </button>
            <h1>All Activities</h1>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={`${styles.card} ${styles.activityCard}`}>
              <div className={styles.activityList}>
                {activities.length === 0 ? (
                  <p>No activities found.</p>
                ) : (
                  activities.map((item) => {
                    const timeText =
                      item.time?.toDate().toLocaleString() || "Just now"
                    return (
                      <div key={item.id} className={styles.activityItem}>
                        <div className={styles.activityAvatar}>
                          <span>
                            {item.user?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className={styles.activityDetails}>
                          <p className={styles.activityTitle}>{item.action}</p>
                          <div className={styles.activityMeta}>
                            <span className={styles.activityTime}>
                              {timeText}
                            </span>
                            <span className={styles.activityUser}>
                              {item.user}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ActivitiesPage
