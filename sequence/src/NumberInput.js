export function InputWithLabel({value, setValue, onInput, label, type, ...additionalParams}) {
	const htmlid = `${label}_input`;
	const params = {
		htmlid,
		value,
		onInput: onInput || function (e) {setValue(e.target.value)},
		type,
		...additionalParams
	}
	return (
		<span className={params.className} style={{verticalAlign: "bottom"}}>
			<label htmlFor={htmlid}>{label}</label>
			<input {...params} />
		</span>
	);
}
export function TMInput({division, setDivision, label, ...params}) {
	return <InputWithLabel {...{setValue: setDivision, value: division, label, type: "number", min: "2", max: "8", ...params}} />

}
export function NumberInput({value, setValue, label, ...params}) {
	return <InputWithLabel {...{setValue, value, label, type: "number", min: "2", max: "8", ...params}} />

}
export function CheckboxInput({checked, setChecked, label, ...params}) {
	return <InputWithLabel {...{onInput: (e) => setChecked(e.target.checked), value: checked, label, type: "checkbox", ...params}} />

}