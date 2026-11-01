// Couleurs sobres, assez sombres pour porter du texte blanc ; utilisées en petites touches
// (étiquettes, fonds de secours quand une carte n'a pas d'image).
export const THEMES = {
  histoire: { id: 'histoire', name: 'Histoire', color: '#9a3b1c' },
  philo: { id: 'philo', name: 'Philosophie', color: '#5b4b8a' },
  sciences: { id: 'sciences', name: 'Sciences', color: '#2f6b4f' },
  maths: { id: 'maths', name: 'Maths', color: '#2b4c7e' },
  geo: { id: 'geo', name: 'Géographie', color: '#2f6a6e' },
  arts: { id: 'arts', name: 'Arts', color: '#8c2f4b' },
  litterature: { id: 'litterature', name: 'Littérature', color: '#7a5a1f' },
  langues: { id: 'langues', name: 'Langues', color: '#3d6a8a' },
  economie: { id: 'economie', name: 'Économie', color: '#55692f' },
  musique: { id: 'musique', name: 'Musique', color: '#7b3b6b' },
  societe: { id: 'societe', name: 'Société', color: '#6b5a44' },
  techno: { id: 'techno', name: 'Technologie', color: '#45505e' },
}

export const THEME_LIST = Object.values(THEMES)
