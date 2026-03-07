from typing import TypedDict, List
from miniTest.common import Common
from minium import BaseElement

from miniTest.components.subA import SubAComponent, SubAComponentInfo, PartialSubAComponentInfo
CustomComponentInfo = TypedDict(
    "CustomComponentInfo",
    {
        "subA1": SubAComponentInfo,
        "subA2": SubAComponentInfo,
    },
)
PartialCustomComponentInfo = TypedDict(
    "PartialCustomComponentInfo",
    {
        "subA1": PartialSubAComponentInfo,
        "subA2": PartialSubAComponentInfo,
    },
    total=False,
)
XxxComponentInfo = TypedDict(
    "XxxComponentInfo",
    {
        "xxx_class": str,
        "xxx_data-status-xxd": str,
        "xxx_style": str,
        "normal_class": str,
        "normal_style": str,
        "normal_data-index": str,
        "_onlyLoop_classList": List[str],
        "_onlyLoop_innerTextList": List[str],
        "_xxxonlyLoop_classList": List[str],
        "_xxxonlyLoop_innerTextList": List[str],
        "ddddxxx_classList": List[str],
        "onlyCondition1_class": str | None,
        "onlyCondition1_innerText": str | None,
        "onlyCondition2_class": str | None,
        "onlyCondition2_innerText": str | None,
        "conditionAndLoop_classList": List[str],
        "conditionAndLoop_styleList": List[str],
        "conditionAndLoop_innerTextList": List[str],
        "customComponents": CustomComponentInfo,
    }
)
PartialXxxComponentInfo = TypedDict(
    "PartialXxxComponentInfo",
    {
        "xxx_class": str,
        "xxx_data-status-xxd": str,
        "xxx_style": str,
        "normal_class": str,
        "normal_style": str,
        "normal_data-index": str,
        "_onlyLoop_classList": List[str],
        "_onlyLoop_innerTextList": List[str],
        "_xxxonlyLoop_classList": List[str],
        "_xxxonlyLoop_innerTextList": List[str],
        "ddddxxx_classList": List[str],
        "onlyCondition1_class": str | None,
        "onlyCondition1_innerText": str | None,
        "onlyCondition2_class": str | None,
        "onlyCondition2_innerText": str | None,
        "conditionAndLoop_classList": List[str],
        "conditionAndLoop_styleList": List[str],
        "conditionAndLoop_innerTextList": List[str],
        "customComponents": PartialCustomComponentInfo,
    },
    total=False,
)
class XxxComponent(Common):
    def __init__(self, cid: str = 'xxx') -> None:
        super().__init__()
        test_instance = Common.get_current_test_instance()
        self.element: BaseElement = test_instance.page.get_element(
            f"view[id$='{cid}']", max_timeout=10
        )
    def getClass(self) -> str:
        return self.element.attribute("class")[0]
    def getDataStatusXxd(self) -> str:
        return self.element.attribute("data-status-xxd")[0]
    def getStyle(self) -> str:
        return self.element.attribute("style")[0]
    def tapXxx(self, count: int = 1) -> None:
        self.tapElement(self.element, count)
    def getElementOfNormal(self) -> BaseElement:
        return self.element.get_element("view[id$='normal']")
    def getClassOfNormal(self) -> str:
        return self.getElementOfNormal().attribute("class")[0]
    def getStyleOfNormal(self) -> str:
        return self.getElementOfNormal().attribute("style")[0]
    def getDataIndexOfNormal(self) -> str:
        return self.getElementOfNormal().attribute("data-index")[0]
    def tapNormal(self, count: int = 1) -> None:
        self.tapElement(self.getElementOfNormal(), count)
    def getElementsOf_onlyLoop(self) -> List[BaseElement]:
        return self.element.get_elements("view[id$='_onlyLoop']")
    def getClassOf_onlyLoop(self) -> List[str]:
        return [element.attribute("class")[0] for element in self.getElementsOf_onlyLoop()]
    def tap_onlyLoop(self,index: int, count: int = 1) -> None:
        elementList = self.getElementsOf_onlyLoop()
        if index < len(elementList):
            element = elementList[index]
            self.tapElement(element, count)
        else:
            raise Exception("Element not found")
    def getInnerTextListOf_onlyLoop(self) -> List[str]:
        return [element.inner_text for element in self.getElementsOf_onlyLoop()]
    def getElementsOf_xxxonlyLoop(self) -> List[BaseElement]:
        return self.element.get_elements("view[id$='_xxxonlyLoop']")
    def getClassOf_xxxonlyLoop(self) -> List[str]:
        return [element.attribute("class")[0] for element in self.getElementsOf_xxxonlyLoop()]
    def tap_xxxonlyLoop(self,index: int, count: int = 1) -> None:
        elementList = self.getElementsOf_xxxonlyLoop()
        if index < len(elementList):
            element = elementList[index]
            self.tapElement(element, count)
        else:
            raise Exception("Element not found")
    def getInnerTextListOf_xxxonlyLoop(self) -> List[str]:
        return [element.inner_text for element in self.getElementsOf_xxxonlyLoop()]
    def getElementsOfDdddxxx(self) -> List[BaseElement]:
        return self.element.get_elements("view[id$='ddddxxx']")
    def getClassOfDdddxxx(self) -> List[str]:
        return [element.attribute("class")[0] for element in self.getElementsOfDdddxxx()]
    def getElementOfOnlyCondition1(self) -> BaseElement | None:
        try:
            return self.element.get_element("view[id$='onlyCondition1']")
        except Exception:
            return None
    def getClassOfOnlyCondition1(self) -> str | None:
        element = self.getElementOfOnlyCondition1()
        if element:
            return element.attribute("class")[0]
        else:
            return None
    def tapOnlyCondition1(self, count: int = 1) -> None:
        element = self.getElementOfOnlyCondition1()
        if element:
            self.tapElement(element, count)
        else:
            raise Exception("Element not found")
    def getInnerTextOfOnlyCondition1(self) -> str | None:
        element = self.getElementOfOnlyCondition1()
        if element:
            return element.inner_text
        else:
            return None
    def getElementOfOnlyCondition2(self) -> BaseElement | None:
        try:
            return self.element.get_element("view[id$='onlyCondition2']")
        except Exception:
            return None
    def getClassOfOnlyCondition2(self) -> str | None:
        element = self.getElementOfOnlyCondition2()
        if element:
            return element.attribute("class")[0]
        else:
            return None
    def tapOnlyCondition2(self, count: int = 1) -> None:
        element = self.getElementOfOnlyCondition2()
        if element:
            self.tapElement(element, count)
        else:
            raise Exception("Element not found")
    def getInnerTextOfOnlyCondition2(self) -> str | None:
        element = self.getElementOfOnlyCondition2()
        if element:
            return element.inner_text
        else:
            return None
    def getElementsOfConditionAndLoop(self) -> List[BaseElement]:
        return self.element.get_elements("view[id$='conditionAndLoop']")
    def getClassOfConditionAndLoop(self) -> List[str]:
        return [element.attribute("class")[0] for element in self.getElementsOfConditionAndLoop()]
    def getStyleOfConditionAndLoop(self) -> List[str]:
        return [element.attribute("style")[0] for element in self.getElementsOfConditionAndLoop()]
    def tapConditionAndLoop(self,index: int, count: int = 1) -> None:
        elementList = self.getElementsOfConditionAndLoop()
        if index < len(elementList):
            element = elementList[index]
            self.tapElement(element, count)
        else:
            raise Exception("Element not found")
    def getInnerTextListOfConditionAndLoop(self) -> List[str]:
        return [element.inner_text for element in self.getElementsOfConditionAndLoop()]
    def getSubAComponentInfo(self,cid:str) -> SubAComponentInfo:
        return SubAComponent(cid).getComponentInfo()
    def getComponentInfo(self) -> XxxComponentInfo:
        return {
            "xxx_class": self.getClass(),
            "xxx_data-status-xxd": self.getDataStatusXxd(),
            "xxx_style": self.getStyle(),
            "normal_class": self.getClassOfNormal(),
            "normal_style": self.getStyleOfNormal(),
            "normal_data-index": self.getDataIndexOfNormal(),
            "_onlyLoop_classList": self.getClassOf_onlyLoop(),
            "_onlyLoop_innerTextList": self.getInnerTextListOf_onlyLoop(),
            "_xxxonlyLoop_classList": self.getClassOf_xxxonlyLoop(),
            "_xxxonlyLoop_innerTextList": self.getInnerTextListOf_xxxonlyLoop(),
            "ddddxxx_classList": self.getClassOfDdddxxx(),
            "onlyCondition1_class": self.getClassOfOnlyCondition1(),
            "onlyCondition1_innerText": self.getInnerTextOfOnlyCondition1(),
            "onlyCondition2_class": self.getClassOfOnlyCondition2(),
            "onlyCondition2_innerText": self.getInnerTextOfOnlyCondition2(),
            "conditionAndLoop_classList": self.getClassOfConditionAndLoop(),
            "conditionAndLoop_styleList": self.getStyleOfConditionAndLoop(),
            "conditionAndLoop_innerTextList": self.getInnerTextListOfConditionAndLoop(),
            "customComponents": {
                "subA1": self.getSubAComponentInfo(cid="subA1"),
                "subA2": self.getSubAComponentInfo(cid="subA2"),
            },
        }
    def assertComponentInfo(self, expectedInfo: PartialXxxComponentInfo) -> None:
        actual_info = self.getComponentInfo()
        self._assertComponentInfo(dict(actual_info), dict(expectedInfo))