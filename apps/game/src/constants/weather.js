// Defines valid weather types and which seasons they can appear in.
// To add new weather: add to WEATHERS and update WEATHER_BY_SEASON.
export const WEATHERS = ['Sunny', 'Rainy', 'Cloudy', 'Foggy', 'Snowy'];
export const WEATHER_BY_SEASON = {
    Spring: ['Sunny', 'Rainy', 'Cloudy'],
    Summer: ['Sunny', 'Sunny', 'Cloudy'],
    Autumn: ['Rainy', 'Foggy', 'Cloudy'],
    Winter: ['Snowy', 'Cloudy', 'Foggy'],
};
export const WEATHER_EMOJIS = {
    Sunny: '☀️',
    Rainy: '🌧️',
    Cloudy: '☁️',
    Foggy: '🌫️',
    Snowy: '❄️',
};
