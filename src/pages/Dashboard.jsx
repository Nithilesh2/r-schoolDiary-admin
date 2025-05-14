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

const Dashboard = () => {
  const { schools, teachers, students } = useContext(AppContext)

  const [activities, setActivities] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, "activities"),
      orderBy("time", "desc"),
      limit(5)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setActivities(data)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.header}>
            <h1>Dashboard</h1>
            <div className={styles.dateSelector}>
              <Calendar size={18} />
              <span>Last 30 days</span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {[
              {
                title: "Total Schools",
                value: schools.length,
                color: "blue",
                icon: <BookOpen size={20} />,
                // trend: "12%",
                // trendDirection: "up",
              },
              {
                title: "Total Teachers",
                value: teachers.length,
                color: "green",
                icon: <Users size={20} />,
                // trend: "5%",
                // trendDirection: "up",
              },
              {
                title: "Total Students",
                value: students.length,
                color: "purple",
                icon: <Users size={20} />,
                // trend: "8%",
                // trendDirection: "up",
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
                  {/* <div
                    className={`${styles.trend} ${styles[stat.trendDirection]}`}
                  >
                    <TrendingUp size={14} />
                    <span>{stat.trend}</span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.dashboardGrid}>
            <div className={`${styles.card} ${styles.activityCard}`}>
              <div className={styles.cardHeader}>
                <h2>Recent Activity</h2>
                <button className={styles.viewAll}>View All</button>
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
