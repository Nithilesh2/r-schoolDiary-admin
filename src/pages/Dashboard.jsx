import { useContext, useEffect, useState } from "react"
import Sidebar from "./../components/Sidebar"
import styles from "./Dashboard.module.css"
import { Calendar, BookOpen, Users } from "react-feather"
import { AppContext } from "../context/AppContext"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore"
import { firestore as db } from "../firebase/firebaseConfig"
import { useNavigate } from "react-router-dom"
import { School } from "lucide-react"

const Dashboard = () => {
  const { schools, teachers, students, isOpen, adminDetails } =
    useContext(AppContext)
  const [activities, setActivities] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(
      collection(db, "activities"),
      orderBy("time", "desc"),
      limit(5)
    )
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
            <h1>Dashboard</h1>
          </div>

          <div className={styles.statsGrid}>
            {[
              ...(adminDetails.adminType !== "school-admin"
                ? [
                    {
                      title: "Total Schools",
                      value: schools.length,
                      color: "blue",
                      icon: <School size={20} />,
                    },
                  ]
                : []),
              {
                title: "Total Teachers",
                value: teachers.length,
                color: "green",
                icon: <Users size={20} />,
              },
              {
                title: "Total Students",
                value: students.length,
                color: "purple",
                icon: <Users size={20} />,
              },
            ].map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div
                  className={`${styles.statIcon} ${
                    styles[
                      "bg" +
                        stat.color.charAt(0).toUpperCase() +
                        stat.color.slice(1)
                    ]
                  }`}
                >
                  {stat.icon}
                </div>
                <div className={styles.statContent}>
                  <h3>{stat.title}</h3>
                  <p className={styles.statValue}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.dashboardGrid}>
            <div className={`${styles.card} ${styles.activityCard}`}>
              <div className={styles.cardHeader}>
                <h2>Recent Activity</h2>
                <button
                  className={styles.viewAll}
                  onClick={() => navigate("/activities")}
                >
                  View All
                </button>
              </div>
              <div className={styles.activityList}>
                {activities.length === 0 ? (
                  <p>No recent activity.</p>
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

export default Dashboard
