// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentItem, setCurrentItem] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [breedIds, setBreedIds] = useState([]);
  const [error, setError] = useState(null);

  const API_KEY = 'live_CW6l7xXjjOOrK2ww3Rtj0BEFv3v4X3dz2wVyFVREJPiexKZ62WeHBxVkbpIS8Efx'; // Replace with your actual key

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const response = await fetch(`https://api.thecatapi.com/v1/breeds?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch breeds');
        const data = await response.json();
        console.log('Breeds fetched:', data.length);
        const ids = data.map(breed => breed.id);
        setBreedIds(ids);
      } catch (error) {
        console.error('Error fetching breeds:', error);
        setError('Failed to load breeds. Please try refreshing the page.');
      }
    };
    fetchBreeds();
  }, []);

  // Helper function to check if a range overlaps with a banned range
  const isRangeBanned = (range, bannedValue) => {
    if (!range || !bannedValue) return false;
    const [min, max] = range.split(' - ').map(Number);
    const [banMin, banMax] = bannedValue.split(' - ').map(Number);
    return (min <= banMax && max >= banMin);
  };

  const fetchRandomItem = async () => {
    if (breedIds.length === 0) {
      console.log('No breeds available yet');
      return;
    }

    try {
      setError(null);
      const randomBreedId = breedIds[Math.floor(Math.random() * breedIds.length)];
      console.log('Fetching cat with breed ID:', randomBreedId);
      
      const response = await fetch(
        `https://api.thecatapi.com/v1/images/search?breed_ids=${randomBreedId}&api_key=${API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch cat image');
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (!data.length || !data[0].breeds || !data[0].breeds[0]) {
        throw new Error('No valid breed data in response');
      }

      const item = data[0];
      const breed = item.breeds[0];

      // Check all bannable attributes
      const banned = banList.some(bannedItem => 
        bannedItem === breed.name ||
        bannedItem === breed.origin ||
        isRangeBanned(breed.weight.metric, bannedItem) ||
        isRangeBanned(breed.life_span, bannedItem)
      );

      if (banned) {
        console.log('Item banned, fetching another:', breed.name);
        fetchRandomItem();
        return;
      }

      const newItem = {
        image: item.url,
        breed: breed.name,
        origin: breed.origin,
        lifespan: breed.life_span,
        weight: breed.weight.metric
      };

      console.log('New cat data:', newItem);
      setCurrentItem(newItem);
      setHistory([newItem, ...history]);
    } catch (error) {
      console.error('Error fetching cat:', error);
      setError('Failed to load cat. Please try again.');
      setTimeout(fetchRandomItem, 1000);
    }
  };

  const handleAttributeClick = (attribute) => {
    if (banList.includes(attribute)) {
      setBanList(banList.filter(item => item !== attribute));
    } else {
      setBanList([...banList, attribute]);
    }
  };

  return (
    <div className="App">
      <h1>Project Veni Vici</h1>
      
      <button 
        onClick={fetchRandomItem} 
        disabled={breedIds.length === 0}
      >
        {breedIds.length === 0 ? 'Loading Breeds...' : 'Discover New Cat'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {currentItem && (
        <div className="item-display">
          <img src={currentItem.image} alt="Random cat" style={{ maxWidth: '300px' }} />
          <div className="attributes">
            <p>
              Breed:{' '}
              <span 
                className={`clickable ${banList.includes(currentItem.breed) ? 'banned' : ''}`}
                onClick={() => handleAttributeClick(currentItem.breed)}
              >
                {currentItem.breed}
              </span>
            </p>
            <p>
              Origin:{' '}
              <span 
                className={`clickable ${banList.includes(currentItem.origin) ? 'banned' : ''}`}
                onClick={() => handleAttributeClick(currentItem.origin)}
              >
                {currentItem.origin}
              </span>
            </p>
            <p>
              Lifespan:{' '}
              <span 
                className={`clickable ${banList.includes(currentItem.lifespan) ? 'banned' : ''}`}
                onClick={() => handleAttributeClick(currentItem.lifespan)}
              >
                {currentItem.lifespan}
              </span>
            </p>
            <p>
              Weight:{' '}
              <span 
                className={`clickable ${banList.includes(currentItem.weight) ? 'banned' : ''}`}
                onClick={() => handleAttributeClick(currentItem.weight)}
              >
                {currentItem.weight} kg
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="ban-list">
        <h2>Ban List</h2>
        {banList.length > 0 ? (
          <ul>
            {banList.map((item, index) => (
              <li key={index} onClick={() => handleAttributeClick(item)}>
                {item} (click to remove)
              </li>
            ))}
          </ul>
        ) : (
          <p>No attributes banned yet</p>
        )}
      </div>

      <div className="history">
        <h2>History</h2>
        {history.length > 0 && (
          <div className="history-items">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <img src={item.image} alt="History item" style={{ maxWidth: '100px' }} />
                <p>{item.breed}</p>
                <p>{item.weight} kg</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
