import logging
import io
import json
import base64
import httpx
from PIL import Image
from dataclasses import dataclass
from typing import List, Optional

logger = logging.getLogger(__name__)

@dataclass
class VisionAnalysisResult:
    roof_material: str
    roof_color: str
    estimated_slope: str
    cardinal_orientation: str
    shading_sources: List[str]
    shading_severity: str
    obstruction_count: int
    obstruction_types: List[str]
    usable_area_fraction: float
    solar_suitability: str
    solar_score: int
    key_observations: List[str]
    recommendation: str
    raw_response: str = ""

class VisionAIService:
    def __init__(self, anthropic_api_key: str):
        self.api_key = anthropic_api_key
        self.model = "claude-opus-4-20250514"

    @staticmethod
    def _prepare_image(image_bytes: bytes, max_px: int = 1024) -> str:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        img.thumbnail((max_px, max_px), Image.LANCZOS)
        
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=90)
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    async def analyse_roof(self, image_bytes: bytes, overlay_bytes: Optional[bytes] = None) -> VisionAnalysisResult:
        if not self.api_key:
            raise ValueError("Anthropic API key is not configured.")

        system_prompt = (
            "You are a rooftop solar feasibility expert analysing a satellite or aerial image.\n"
            "Examine the rooftop and return ONLY a valid JSON object (no markdown, no explanation):\n"
            "{\n"
            '  "roof_material": "concrete|metal|tiles|asphalt|unknown",\n'
            '  "roof_color": "light|medium|dark",\n'
            '  "estimated_slope": "flat|low|medium|steep",\n'
            '  "cardinal_orientation": "north|south|east|west|south-east|south-west|unknown",\n'
            '  "shading_sources": ["tree","adjacent_building","chimney","AC_unit","none"],\n'
            '  "shading_severity": "none|low|moderate|high",\n'
            '  "obstruction_count": 0,\n'
            '  "obstruction_types": [],\n'
            '  "usable_area_fraction": 0.75,\n'
            '  "solar_suitability": "excellent|good|moderate|poor",\n'
            '  "solar_score": 82,\n'
            '  "key_observations": ["obs1","obs2","obs3"],\n'
            '  "recommendation": "one sentence for building owner"\n'
            "}\n"
            "Be conservative with usable_area_fraction. Return ONLY the JSON."
        )

        base64_main = self._prepare_image(image_bytes)
        
        content_items = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": base64_main
                }
            }
        ]

        if overlay_bytes:
            base64_overlay = self._prepare_image(overlay_bytes)
            content_items.insert(0, {
                "type": "text", 
                "text": "Second image shows SAM2-detected roof in amber overlay."
            })
            content_items.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": base64_overlay
                }
            })

        content_items.append({
            "type": "text",
            "text": system_prompt
        })

        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [
                {
                    "role": "user",
                    "content": content_items
                }
            ]
        }
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages", 
                    json=payload, 
                    headers=headers
                )
                resp.raise_for_status()
                
                result_json = resp.json()
                raw_text = result_json["content"][0]["text"]
                
                # Strip markdown code fences if claude added them despite instructions
                cleaned_text = raw_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.startswith("```"):
                    cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                    
                cleaned_text = cleaned_text.strip()
                data = json.loads(cleaned_text)
                
                return VisionAnalysisResult(
                    roof_material=data.get("roof_material", "unknown"),
                    roof_color=data.get("roof_color", "medium"),
                    estimated_slope=data.get("estimated_slope", "unknown"),
                    cardinal_orientation=data.get("cardinal_orientation", "unknown"),
                    shading_sources=data.get("shading_sources", []),
                    shading_severity=data.get("shading_severity", "unknown"),
                    obstruction_count=data.get("obstruction_count", 0),
                    obstruction_types=data.get("obstruction_types", []),
                    usable_area_fraction=float(data.get("usable_area_fraction", 0.7)),
                    solar_suitability=data.get("solar_suitability", "moderate"),
                    solar_score=int(data.get("solar_score", 50)),
                    key_observations=data.get("key_observations", []),
                    recommendation=data.get("recommendation", ""),
                    raw_response=raw_text
                )
            except Exception as e:
                logger.error(f"Vision API failure: {str(e)}")
                raise Exception(f"Vision analysis failed: {str(e)}")
