// Typographie française : espace insécable avant ? ! : ; » et après «, pour éviter
// qu'un signe se retrouve seul en début de ligne.
export const frTypo = (text) => text.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ')
