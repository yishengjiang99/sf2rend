import React from "react"
import "./collapsible.css"
export default function Collapsible({children, title}) {
	return <div className="wrap-collabsible inline-block">
		<input id="collapsible" className="toggle" type="checkbox" />
		<label htmlFor="collapsible" className="lbl-toggle">{title}</label>
		<div className="collapsible-content">
			<div className="content-inner">
				<p>
					{children}
				</p>
			</div>
		</div>
	</div>
}