import math
from sci_plot import PythonChart

# 1. Create a new chart
chart = PythonChart("my-chart")
chart.set_title("Real-time Prediction Demo")

# 2. Generate some data
x_values = [i * 0.1 for i in range(100)]
y_values = [math.sin(x) for x in x_values]

# 3. Add to chart
chart.add_series("line", x_values, y_values, label="Sine Wave", color="#00ffcc")

# 4. Generate JSON for the frontend
print("Exporting chart configuration...")
config_json = chart.to_json()

# You can now send this JSON to the TypeScript chart using:
# chart.deserialize(json.loads(config_json))
print(config_json)
