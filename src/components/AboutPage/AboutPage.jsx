import React from 'react';

// This is one of our simplest components
// It doesn't have local state,
// It doesn't dispatch any redux actions or display any part of redux state
// or even care what the redux state is'

function AboutPage() {
  return (
    <div className="container">
    
      <div>
        <h2>Never Lose Your Mushroom Spot Again!</h2>
        <p>Keeping track of all the mushrooms you find in the wild can be a difficult task. Using a map with pins alone is inadequate to provide all the information you might want to revisit. ShroomLogger enables you to upload pictures, descriptions and locations to create a complete history of your favorite fungi locations.</p>
        <p>Comments or suggestions can be sent to sfuoss@gmail.com.</p>
 <footer>ShroomLogger &copy; Sarah Fuoss</footer>
      </div>
    </div>
  );
}

export default AboutPage;
