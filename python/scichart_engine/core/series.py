from typing import Any, Dict, List

class SeriesBuilder:
    """Helper to build complex series configurations."""
    
    @staticmethod
    def create_line(x: List[float], y: List[float], name: str = "Line", color: str = "#00ffcc") -> Dict[str, Any]:
        return {
            "type": "line",
            "name": name,
            "data": {"x": list(x), "y": list(y)},
            "style": {"color": color, "width": 2}
        }

    @staticmethod
    def create_scatter(x: List[float], y: List[float], name: str = "Scatter", color: str = "#ff00ff") -> Dict[str, Any]:
        return {
            "type": "scatter",
            "name": name,
            "data": {"x": list(x), "y": list(y)},
            "style": {"color": color, "pointSize": 5}
        }
