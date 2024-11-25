export function errorHandler(handlerName) {
	return function(handler){
		return function(...args){

			try{
				const result = handler(...args)

				if(result && typeof result.then === 'function'){
					return result.then(result => {
						return result
					}).catch(error => {
						handleError(error, handlerName, args)
					})
				}

			}catch (error) {
				return handleError(error, handlerName, args);
			}

		}
	}
}

function handleError(error, handlerName, args){
	const errorMessage = (error.message || error.toString()).trim().toLowerCase()

	console.error(`Error in ${handlerName}: ${errorMessage}`)
}