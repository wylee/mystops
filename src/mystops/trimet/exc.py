class TriMetAPIError(Exception):
    pass


class TriMetAPIStopIDNotFoundError(Exception):
    def __init__(self, stop_id):
        super().__init__(stop_id)
        self.stop_id = stop_id
