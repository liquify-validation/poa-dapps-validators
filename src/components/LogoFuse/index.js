import React from 'react'
import logoFuse from './logo.svg'
import logoFuseFooter from '../Assets/footer-logo.svg'
import { NavLink } from 'react-router-dom'

export const LogoFuse = ({ href = null, extraClass = '' }) => {
  return (
    <NavLink to={href} className={`sw-LogoFuse ${extraClass}`}>
      <img className="sw-LogoFuse_Image" src={logoFuse} alt="" />
    </NavLink>
  )
}

export const LogoFuseFooter = ({ href = null, extraClass = '' }) => {
  return (
    <NavLink to={href} className={`sw-LogoFuse ${extraClass}`}>
      <img className="sw-LogoFuse_Image" src={logoFuseFooter} alt="" />
    </NavLink>
  )
}
