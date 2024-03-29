export function subScribeEvent({target, event, precateFilter, timeout}) {
	return new Promise((resolve, reject) => {
		precateFilter ||= () => true;
		target.addEventListener(event, (e) => {
			precateFilter(e) && resolve(e.data);
		});
		setTimeout(reject, timeout || 2000);
	});
}
