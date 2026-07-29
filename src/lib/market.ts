import { Coin, MarketSettings } from '../types';

export function calculateCoinOscillation(coin: Coin, settings: MarketSettings): Coin {
  let minChange = -settings.maxDownPercent;
  let maxChange = settings.maxUpPercent;

  switch (settings.preset) {
    case 'Alta forte':
      minChange = 1.0;
      maxChange = Math.max(3.0, settings.maxUpPercent * 1.5);
      break;
    case 'Alta moderada':
      minChange = 0.2;
      maxChange = Math.max(1.5, settings.maxUpPercent);
      break;
    case 'Baixa moderada':
      minChange = -Math.max(1.5, settings.maxDownPercent);
      maxChange = -0.2;
      break;
    case 'Baixa forte':
      minChange = -Math.max(3.0, settings.maxDownPercent * 1.5);
      maxChange = -1.0;
      break;
    case 'Neutro':
      minChange = -1.0;
      maxChange = 1.0;
      break;
    case 'Aleatório':
    default:
      minChange = -settings.maxDownPercent;
      maxChange = settings.maxUpPercent;
      break;
  }

  // Generate random percentage change between minChange and maxChange
  const randomPercent = (Math.random() * (maxChange - minChange) + minChange) / 100;
  
  const oldPrice = coin.price;
  let newPrice = oldPrice * (1 + randomPercent);
  if (newPrice < 0.0001) newPrice = 0.0001;
  newPrice = Math.round(newPrice * 10000) / 10000;

  const variation = Math.round(((newPrice - oldPrice) / oldPrice) * 1000) / 10;
  
  // Maintain sparkline history (last 6 items)
  const newHistory = [...(coin.history || []).slice(-5), newPrice];

  return {
    ...coin,
    price: newPrice,
    variation: variation,
    history: newHistory
  };
}
