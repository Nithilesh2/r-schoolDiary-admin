import { useContext, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  School,
  Users,
  BookUser,
  LogOut,
  Building2,
  CirclePlus,
  UserRound,
  GraduationCap,
  CalendarCheck,
  ChevronsUp,
  Clock,
  DollarSign,
  FileSpreadsheet,
} from "lucide-react"
import styles from "./styles/Sidebar.module.css"
import { AppContext } from "../context/AppContext"
import { useCookies } from "react-cookie"
import { signOut } from "firebase/auth"
import { auth } from "../firebase/firebaseConfig"

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { setIsOpen, isOpen, adminDetails } = useContext(AppContext)
  const [, , removeCookie] = useCookies(["userAuthenticated"])
  const [openDropdown, setOpenDropdown] = useState(null)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      removeCookie("userAuthenticated", { path: "/" })
      localStorage.clear()
      navigate("/login", { replace: true })
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    ...(adminDetails.adminType !== "school-admin"
      ? [
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
        ]
      : []),
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
        {
          name: "Add Bulk Student",
          path: "/students/add-bulk",
          icon: <FileSpreadsheet size={18} />,
        },
      ],
    },
    {
      name: "Academic Year",
      path: "/academic-year",
      icon: <CalendarCheck size={20} />,
      dropdown: [
        {
          name: "Year End Reports",
          path: "/academic-year/reports",
          icon: <BookUser size={18} />,
        },
        {
          name: "Promote Classes",
          path: "/academic-year/promote",
          icon: <ChevronsUp size={18} />,
        },
      ],
    },
    ...(adminDetails.adminType === "school-admin"
      ? [
          {
            name: "Timetable",
            path: "/timetable",
            icon: <Clock size={20} />,
          },
          {
            name: "Fees",
            path: "/fees",
            icon: <DollarSign size={20} />,
            dropdown: [
              {
                name: "Set Total Fees",
                path: "/fees/set-total-fees",
                icon: <CirclePlus size={18} />,
              },
              {
                name: "Manage Fees",
                path: "/fees/manage-fees",
                icon: <DollarSign size={18} />,
              },
            ],
          },
        ]
      : []),
    {
      name: "Logout",
      action: "logout",
      icon: <LogOut size={20} />,
    },
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
            ) : item.action === "logout" ? (
              <div
                onClick={handleLogout}
                className={styles.navItem}
                style={{ cursor: "pointer" }}
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
