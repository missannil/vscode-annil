from typing import TypedDict, List
from miniTest.common import Common
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
    def __init__(self, element: BaseElement | None = None) -> None:
        super().__init__()
        if element is None:
            self.element = self.page.get_element("scroll-view[id$='subA']")
        else:
            self.element = element
    def getClass(self) -> str:
        return self.element.attribute("class")[0]
    def getComponentInfo(self) -> SubAComponentInfo:
        return {
            "subA_class": self.getClass(),
        }
    def assertComponentInfo(self, expectedInfo: PartialSubAComponentInfo) -> None:
        actual_info = self.getComponentInfo()
        self._assertComponentInfo(dict(actual_info), dict(expectedInfo))