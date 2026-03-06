from typing import TYPE_CHECKING, TypedDict, List, Optional, Any
from miniTest.common import Common

if TYPE_CHECKING:
    from minium import BaseElement
SubAComponentInfo = TypedDict(
    "SubAComponentInfo",
    {
        "subA_class": str,
    }
)
PartialSubAComponentInfo = TypedDict(
    "PartialSubAComponentInfo",
    {
        "subA_class": str,
    },
    total=False,
)
class SubAComponent(Common):
    def __init__(self, cid: str = 'subA') -> None:
        super().__init__()
        self.element: BaseElement = self.page.get_element(
            f"scroll-view[id$='{cid}']", max_timeout=3
        )
    def getClass(self) -> str:
        return self.element.attribute("class")[0]
    def getComponentInfo(self) -> SubAComponentInfo:
        return {
            "subA_class": self.getClass(),
        }
    def assertComponentInfo(self, expectedInfo: PartialSubAComponentInfo) -> None:
        actual_info = self.getComponentInfo()
        self._assertComponentInfo(dict(actual_info), dict(expectedInfo))