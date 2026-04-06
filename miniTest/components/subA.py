from miniTest.common import Common, BaseElement, TypedDict, cast, List, DiffConfig

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


class SubAComponent(Common):
    def __init__(self, rootElement: BaseElement) -> None:
        super().__init__()
        self.rootElement = rootElement

    def getClass(self) -> str:
        return self.rootElement.attribute("class")[0]

    def methodsRecord(self) -> dict:
        return {
            "subA_class": ["getClass", ""],
        }

    def getComponentInfo(self) -> SubAComponentInfo:
        return {
            "subA_class": self.getClass(),
        }

    def assertComponentInfo(
        self,
        expectedInfo: PartialSubAComponentInfo,
        diffConfig: DiffConfig | None = None,
    ) -> None:
        methods_record = self.methodsRecord()
        actual_info: dict = {}
        for key in expectedInfo:
            if key in methods_record:
                method_name, arg = methods_record[key]
                if arg:
                    actual_info[key] = getattr(self, method_name)(cid=arg)
                else:
                    actual_info[key] = getattr(self, method_name)()
        self.dict_diff(dict(actual_info), dict(expectedInfo), compareConfig=diffConfig)
