import json
from typing import List, Dict, Any, Optional

class PythonChart:
    """
    Python equivalent of the SciPlot object.
    It helps in building a configuration that can be serialized to JSON.
    """
    def __init__(self, container_id: str = "chart-container"):
        self.container_id = container_id
        self.series = []
        self.options = {
            "title": "SciPlot from Python",
            "xAxis": {"title": "X Axis"},
            "yAxis": {"title": "Y Axis"},
            "theme": "dark"
        }

    def add_series(self, type: str, x: List[float], y: List[float], label: str = None, color: str = None):
        """Add a series to the chart configuration."""
        series_data = {
            "type": type,
            "id": f"s{len(self.series)}",
            "name": label or f"Series {len(self.series)}",
            "data": {
                "x": list(x),
                "y": list(y)
            }
        }
        if color:
            series_data["style"] = {"color": color}
        
        self.series.append(series_data)
        return self

    def set_title(self, title: str):
        self.options["title"] = title
        return self

    def to_json(self) -> str:
        """Export the full configuration to a JSON string compatible with sci-plot."""
        full_config = {
            "containerId": self.container_id,
            "options": self.options,
            "series": self.series
        }
        return json.dumps(full_config, indent=2)

    def save(self, filename: str):
        """Save the config to a file."""
        with open(filename, 'w') as f:
            f.write(self.to_json())
        print(f"Chart configuration saved to {filename}")
