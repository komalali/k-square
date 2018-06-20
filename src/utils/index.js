// Make this a function so it can be easily reused when updating the chart.
export default function generateRandomDataset(numberOfDataPoints) {
  const dataPoints = [];
  for (let i = 0; i < numberOfDataPoints; i++) {
    const randomNumber = Math.floor(Math.random() * 21) + 5;
    dataPoints.push(randomNumber);
  }
  return dataPoints;
}
