import json
from typing import TypedDict, List, cast
from miniTest.common import BaseElement, DiffConfig, assertions, extension

SubAComponentInfo = TypedDict(
    "SubAComponentInfo",
    {
        "subA_class": str,
    },
)
PartialSubAComponentInfo = TypedDict(
    "PartialSubAComponentInfo",
    {
        "subA_class": str,
    },
    total=False,
)


class SubAComponent:
    def __init__(self, rootElement: BaseElement) -> None:
        super().__init__()
        self.rootElement = rootElement

    def getClass(self) -> str:
        return self.rootElement.attribute("class")[0]

    def getComponentInfo(self) -> SubAComponentInfo:
        return {
            "subA_class": self.getClass(),
        }

    def assertComponentInfo(
        self,
        expectedInfo: PartialSubAComponentInfo,
        diffConfig: DiffConfig | None = None,
    ) -> None:
        actual_info = self.getComponentInfo()
        diffs = (
            assertions.dict_diff(
                dict(actual_info), dict(expectedInfo), compareConfig=diffConfig
            ),
        )
        if diffs:
            raise AssertionError(
                f"❌字典不匹配❌:字段差异: {json.dumps(diffs, ensure_ascii=False, indent=2)}"
            )
