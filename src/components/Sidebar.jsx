import { useContext, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  School,
  Users,
  BookUser,
  Settings,
  Building2,
  CirclePlus,
  UserRound,
  GraduationCap,
} from "lucide-react"
import styles from "./styles/Sidebar.module.css"
import { AppContext } from "../context/AppContext"

const Sidebar = () => {
  const location = useLocation()
  const { setIsOpen, isOpen } = useContext(AppContext)

  const [openDropdown, setOpenDropdown] = useState(null)

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    {
      name: "Schools",
      path: "/schools",
      icon: <School size={20} />,
      dropdown: [
        {
          name: "All Schools",
          path: "/schools",
          icon: <Building2 size={18} />,
        },
        {
          name: "Add School",
          path: "/schools/add",
          icon: <CirclePlus size={18} />,
        },
      ],
    },
    {
      name: "Teachers",
      path: "/teachers",
      icon: <Users size={20} />,
      dropdown: [
        {
          name: "All Teachers",
          path: "/teachers",
          icon: <UserRound size={18} />,
        },
        {
          name: "Add Teacher",
          path: "/teachers/add",
          icon: <CirclePlus size={18} />,
        },
      ],
    },
    {
      name: "Students",
      path: "/students",
      icon: <BookUser size={20} />,
      dropdown: [
        {
          name: "All Students",
          path: "/students",
          icon: <GraduationCap size={18} />,
        },
        {
          name: "Add Student",
          path: "/students/add",
          icon: <CirclePlus size={18} />,
        },
      ],
    },
    // { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ]

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <div
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
    >
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "<" : ">"}
      </button>

      <div className={styles.sidebarHeader}>
        <School size={28} />
        {isOpen && <h1>School Diary Admin</h1>}
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <div key={item.name}>
            {item.dropdown ? (
              <div
                className={`${styles.navItem} ${
                  openDropdown === item.name ? styles.activeParent : ""
                }`}
                onClick={() => toggleDropdown(item.name)}
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`${styles.navItem} ${
                  location.pathname === item.path ? styles.active : ""
                }`}
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </Link>
            )}

            {item.dropdown && openDropdown === item.name && (
              <div
                className={`${styles.dropdown} ${
                  openDropdown === item.name ? styles.open : ""
                }`}
              >
                {item.dropdown.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`${styles.navItem} ${
                      location.pathname === subItem.path ? styles.active : ""
                    }`}
                  >
                    {subItem.icon}
                    {isOpen && <span>{subItem.name}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
